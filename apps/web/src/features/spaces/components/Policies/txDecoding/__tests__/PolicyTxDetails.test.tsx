import { render, screen } from '@/tests/test-utils'
import { AbiCoder, Interface } from 'ethers'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import { PolicyType } from '@safe-global/store/gateway/policies/types'
import useSafeInfo from '@/hooks/useSafeInfo'
import { extendedSafeInfoBuilder } from '@/tests/builders/safe'
import { availablePolicyBuilder } from '@/tests/builders/policies'
import { useAvailablePolicies } from '../../hooks/useAvailablePolicies'
import { useActivePolicies } from '../../hooks/useActivePolicies'
import { PERMISSION_ALWAYS, PERMISSION_NONE, RECIPIENT_DATA_TYPE } from '../../shared/erc20TransferPolicy'
import { mockDelayedGuardDto } from '../../mocks/pendingPolicies'
import {
  APPLY_CONFIGURATION_ABI,
  CONFIGURE_IMMEDIATELY_ABI,
  REQUEST_CONFIGURATION_ABI,
  computeConfigureRoot,
  type PolicyConfiguration,
} from '../../shared/guardTx'
import { NO_SELECTOR, OPERATION_CALL, OPERATION_DELEGATECALL } from '../../shared/accessSelector'
import PolicyTxDetails from '../PolicyTxDetails'

// Module-level: `restoreAllMocks` would otherwise swap the real hook back in while an async
// update is still queued, changing the hook count mid-test.
jest.mock('@/hooks/useSafeInfo')
const mockPendingQuery = jest.fn()
jest.mock('@/store/api/gateway/spacePolicies', () => ({
  useSpacePoliciesGetPendingPoliciesV1Query: (...args: unknown[]) => mockPendingQuery(...args),
}))
jest.mock('../../../../hooks/useCurrentSpaceId', () => ({ useCurrentSpaceId: () => 'space-1' }))
jest.mock('../../hooks/useAvailablePolicies')
jest.mock('../../hooks/useActivePolicies')

// The shared address renderer needs a chain to resolve explorer links and prefixes. `features` is
// required on a chain config: chain 1 is the ENS hub, so the resolver reads it to decide on lookups.
jest.mock('@/hooks/useChains', () => ({
  __esModule: true,
  default: () => ({ configs: [{ chainId: '1', shortName: 'eth', features: [] }] }),
  useChain: () => ({ chainId: '1', shortName: 'eth', features: [] }),
  useCurrentChain: () => ({ chainId: '1', shortName: 'eth', features: [], blockExplorerUriTemplate: {} }),
  useHasFeature: () => true,
}))
const mockedUseSafeInfo = jest.mocked(useSafeInfo)
const mockedUseAvailablePolicies = jest.mocked(useAvailablePolicies)
const mockedUseActivePolicies = jest.mocked(useActivePolicies)

const mockPending = (currentData: unknown[] = []) => mockPendingQuery.mockReturnValue({ currentData })

const CHAIN_ID = '1'
const SAFE = '0x1111111111111111111111111111111111111111'
const TOKEN = '0x51ff5573d2364108Dd4F294f28173F90E124b9F5'
const RECIPIENT = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'
const REMOVED = '0xc918e75504D1B0c741Eb4236B72Dae7A52401E95'
const COSIGNER = '0x8b0aB586dF1Ca1f360cb26b34eEC2C3AF969E821'
const GUARD = '0xde4c448904537EBBA654Ac3803E7D74A77C7a1a8'
const TRANSFER = '0xa9059cbb'

const CONTRACTS: Record<string, string> = {
  [PolicyType.TokenWithdraw]: '0x37AB4Fd7eFaDfC6cc35e09196f74c19F163EdA43',
  [PolicyType.Cosigner]: '0xC49f4786aF99b7c3Edf0A3F71E6B969B76302ca5',
  [PolicyType.Allow]: '0x3e40e32CE2BC4aFF4D1A9BE293C119ce4Fb52eAc',
  [PolicyType.Deny]: '0xA78478404a909d9Fc4A693ed6c91508d0E6a071a',
  [PolicyType.NativeTransfer]: '0x77d29DEaE811D5E42fbe292d3f2729403e11cA3A',
}

/** The catalogue is what maps a policy contract back to its type. */
const mockCatalogue = () => {
  mockedUseAvailablePolicies.mockReturnValue({
    policies: Object.entries(CONTRACTS).map(([type, policyContract]) =>
      availablePolicyBuilder()
        .with({
          type: type as PolicyType,
          enforcement: { via: 'guard', guards: { transactionGuard: { policyContract, safePolicyGuard: GUARD } } },
        })
        .build(),
    ),
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
  })

  mockedUseActivePolicies.mockReturnValue({ policies: [], isLoading: false, isError: false, refetch: jest.fn() })

  mockedUseSafeInfo.mockReturnValue({
    safeAddress: SAFE,
    safe: extendedSafeInfoBuilder()
      .with({ address: { value: SAFE }, chainId: CHAIN_ID })
      .build(),
    safeLoaded: true,
    safeLoading: false,
  })
}

const recipientData = (recipients: Array<[string, number]>) =>
  AbiCoder.defaultAbiCoder().encode([RECIPIENT_DATA_TYPE], [recipients])

const configuration = (overrides: Partial<PolicyConfiguration> = {}): PolicyConfiguration => ({
  target: TOKEN,
  selector: TRANSFER,
  operation: OPERATION_CALL,
  policy: CONTRACTS[PolicyType.TokenWithdraw],
  data: recipientData([[RECIPIENT, PERMISSION_ALWAYS]]),
  ...overrides,
})

const configureImmediatelyData = (configurations: PolicyConfiguration[]) =>
  new Interface(CONFIGURE_IMMEDIATELY_ABI).encodeFunctionData('configureImmediately', [
    configurations.map((c) => [c.target, c.selector, c.operation, c.policy, c.data]),
  ])

const renderTx = (hexData: string, method = 'configureImmediately') =>
  render(
    <PolicyTxDetails txData={{ to: { value: GUARD }, hexData, dataDecoded: { method, parameters: [] } } as never} />,
  )

describe('PolicyTxDetails', () => {
  beforeEach(() => {
    mockCatalogue()
    mockPending()
  })

  afterEach(() => {
    window.localStorage.clear()
    jest.restoreAllMocks()
  })

  it('names the policy and what it applies to', () => {
    renderTx(configureImmediatelyData([configuration()]))

    expect(screen.getByText('Token withdraw allowlist')).toBeInTheDocument()
    expect(screen.getByText('Applies to')).toBeInTheDocument()
    expect(screen.getByText(TRANSFER)).toBeInTheDocument()
  })

  it('splits an ERC20 allowlist into added and removed recipients', () => {
    renderTx(
      configureImmediatelyData([
        configuration({
          data: recipientData([
            [RECIPIENT, PERMISSION_ALWAYS],
            [REMOVED, PERMISSION_NONE],
          ]),
        }),
      ]),
    )

    expect(screen.getByText('Allowed recipients')).toBeInTheDocument()
    expect(screen.getByText('Removed recipients')).toBeInTheDocument()
  })

  it('shows the cosigner address', () => {
    renderTx(
      configureImmediatelyData([
        configuration({
          policy: CONTRACTS[PolicyType.Cosigner],
          data: AbiCoder.defaultAbiCoder().encode(['address'], [COSIGNER]),
        }),
      ]),
    )

    expect(screen.getByText('Cosigner address')).toBeInTheDocument()
    // The shared address component splits an address across elements, so match a segment.
    expect(screen.getByText('8b0a', { exact: false })).toBeInTheDocument()
  })

  it('reads a zero cosigner as cleared', () => {
    renderTx(
      configureImmediatelyData([
        configuration({
          policy: CONTRACTS[PolicyType.Cosigner],
          data: AbiCoder.defaultAbiCoder().encode(['address'], [ZERO_ADDRESS]),
        }),
      ]),
    )

    expect(screen.getByText('Cleared — no cosigner required')).toBeInTheDocument()
  })

  // Allow, Deny and native transfers carry no payload, and their access is the catch-all.
  it.each([
    [PolicyType.Allow, 'Allow by default'],
    [PolicyType.Deny, 'Deny by default'],
    [PolicyType.NativeTransfer, 'Native transfers'],
  ] as const)('labels %s and shows no payload row', (type, label) => {
    renderTx(
      configureImmediatelyData([
        configuration({ policy: CONTRACTS[type], target: ZERO_ADDRESS, selector: NO_SELECTOR, data: '0x' }),
      ]),
    )

    expect(screen.getByText(label)).toBeInTheDocument()
    expect(screen.getByText('Any transaction')).toBeInTheDocument()
    expect(screen.getByText('Fallback')).toBeInTheDocument()
    expect(screen.queryByText('Policy data')).not.toBeInTheDocument()
  })

  it('flags a delegate-call access', () => {
    renderTx(configureImmediatelyData([configuration({ operation: OPERATION_DELEGATECALL })]))

    expect(screen.getByText(`${TRANSFER} · delegate call`)).toBeInTheDocument()
  })

  it('numbers the rules of a multi-policy configuration', () => {
    renderTx(configureImmediatelyData([configuration(), configuration({ target: RECIPIENT })]))

    expect(screen.getByText('Rule 1 of 2')).toBeInTheDocument()
    expect(screen.getByText('Rule 2 of 2')).toBeInTheDocument()
  })

  it('decodes an applyConfiguration the same way', () => {
    const hexData = new Interface(APPLY_CONFIGURATION_ABI).encodeFunctionData('applyConfiguration', [
      [
        [
          TOKEN,
          TRANSFER,
          OPERATION_CALL,
          CONTRACTS[PolicyType.TokenWithdraw],
          recipientData([[RECIPIENT, PERMISSION_ALWAYS]]),
        ],
      ],
    ])

    renderTx(hexData, 'applyConfiguration')

    expect(screen.getByText('Token withdraw allowlist')).toBeInTheDocument()
    expect(screen.getByText('Allowed recipients')).toBeInTheDocument()
  })

  describe('requestConfiguration', () => {
    const requestData = (root: string) =>
      new Interface(REQUEST_CONFIGURATION_ABI).encodeFunctionData('requestConfiguration', [root])

    // The root is all that's on-chain; CGW holds the configurations the wallet stored before proposing it.
    it('shows the policies CGW stored behind the root', () => {
      const configurations = [configuration()]
      const root = computeConfigureRoot(configurations)
      mockPending([mockDelayedGuardDto({ root, configurations: configurations as never })])

      renderTx(requestData(root), 'requestConfiguration')

      expect(screen.getByText('Configuration root')).toBeInTheDocument()
      expect(screen.getByText('Token withdraw allowlist')).toBeInTheDocument()
      expect(screen.getByText('Allowed recipients')).toBeInTheDocument()
    })

    it('explains the gap when CGW does not know the payload', () => {
      mockPending([mockDelayedGuardDto({ root: `0x${'cd'.repeat(32)}`, configurations: null })])
      renderTx(requestData(`0x${'cd'.repeat(32)}`), 'requestConfiguration')

      expect(screen.getByText('Configuration root')).toBeInTheDocument()
      expect(screen.getByText(/shown when the change is applied/i)).toBeInTheDocument()
      expect(screen.queryByText('Applies to')).not.toBeInTheDocument()
    })
  })

  it('still decodes the payload without a catalogue', () => {
    mockedUseAvailablePolicies.mockReturnValue({
      policies: [],
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    })

    renderTx(configureImmediatelyData([configuration()]))

    expect(screen.queryByText('Token withdraw allowlist')).not.toBeInTheDocument()
    expect(screen.getByText('Allowed recipients')).toBeInTheDocument()
  })

  it('renders nothing for calldata that isn’t a policy configuration', () => {
    const { container } = renderTx('0xdeadbeef', 'somethingElse')

    expect(container).toBeEmptyDOMElement()
  })
})
