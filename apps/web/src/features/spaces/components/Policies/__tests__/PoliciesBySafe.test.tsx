import { render, screen, fireEvent, waitFor, within } from '@/tests/test-utils'
import { Interface } from 'ethers'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import { PolicyType } from '@safe-global/store/gateway/policies/types'
import * as spaces from '@/features/spaces'
import { TxModalContext } from '@/components/tx-flow'
import { availablePolicyBuilder, fallbackPolicyBuilder, tokenWithdrawPolicyBuilder } from '@/tests/builders/policies'
import { APPLY_CONFIGURATION_ABI, computeConfigureRoot } from '../shared/guardTx'
import { savePolicyRequestApi, type PolicyRequest } from '../policyRequestStore'
import { useActivePolicies } from '../hooks/useActivePolicies'
import { useAvailablePolicies } from '../hooks/useAvailablePolicies'
import { usePendingPolicies } from '../hooks/usePendingPolicies'
import PoliciesBySafe from '../PoliciesBySafe'

// Module-level mocks: `restoreAllMocks` would otherwise swap the real hooks back in
// mid-test, while an async update is still queued, and change the hook count.
jest.mock('../hooks/useActivePolicies')
jest.mock('../hooks/useAvailablePolicies')
jest.mock('../hooks/usePendingPolicies')

jest.mock('@/hooks/useChains', () => ({
  __esModule: true,
  default: () => ({ configs: [{ chainId: '1', shortName: 'eth' }] }),
  useChain: () => ({ chainId: '1', shortName: 'eth' }),
  useHasFeature: () => true,
}))

const mockedActive = jest.mocked(useActivePolicies)
const mockedAvailable = jest.mocked(useAvailablePolicies)
const mockedPending = jest.mocked(usePendingPolicies)

const SAFE = { chainId: '1', address: '0x1111111111111111111111111111111111111111', name: 'Ops Safe' }
const TOKEN = '0x4444444444444444444444444444444444444444'
const POLICY = '0x2222222222222222222222222222222222222222'
const GUARD = '0x3333333333333333333333333333333333333333'

const CATALOGUE = [
  availablePolicyBuilder()
    .with({ type: PolicyType.TokenWithdraw, title: 'Token withdraw allowlist', description: 'Restrict recipients.' })
    .build(),
  // Module-enforced: CGW reports no wiring, so it can't be built against.
  availablePolicyBuilder()
    .with({
      type: PolicyType.SpendingLimit,
      title: 'Spending limit',
      description: 'Cap withdrawals.',
      enforcement: null,
    })
    .build(),
  availablePolicyBuilder()
    .with({ type: PolicyType.Cosigner, title: 'Cosigner', description: 'Require a cosigner.' })
    .build(),
  fallbackPolicyBuilder()
    .with({ type: PolicyType.Allow, title: 'Allow by default', description: 'Permit anything uncovered.' })
    .build(),
  fallbackPolicyBuilder()
    .with({ type: PolicyType.Deny, title: 'Deny by default', description: 'Block anything uncovered.' })
    .build(),
]

const configuration = { target: TOKEN, selector: '0xa9059cbb', operation: 0, policy: POLICY, data: '0x' }

const saveRequest = (overrides: Partial<PolicyRequest> = {}): PolicyRequest => {
  const request: PolicyRequest = {
    id: 'root-1',
    chainId: SAFE.chainId,
    safeAddress: SAFE.address,
    type: PolicyType.TokenWithdraw,
    enforcement: { via: 'guard', guards: { transactionGuard: { policyContract: POLICY, safePolicyGuard: GUARD } } },
    data: {
      allowlist: [
        { token: { address: TOKEN, symbol: 'USDC', decimals: 6 }, recipients: [{ address: POLICY, name: null }] },
      ],
    },
    configurations: [configuration],
    // Self-consistent, like a real request: the root is the hash of the configurations.
    configureRoot: computeConfigureRoot([configuration]),
    requestedAt: 1_000,
    readyAt: 1_000 + 86_400,
    delaySec: 86_400,
    ...overrides,
  }
  savePolicyRequestApi.save(request)
  return request
}

type PendingItems = ReturnType<typeof usePendingPolicies>['policies']

const mockPending = (items: PendingItems = []) => {
  const refetch = jest.fn()
  mockedPending.mockReturnValue({ policies: items, isLoading: false, isError: false, refetch })
  return refetch
}

const renderPage = (setTxFlow = jest.fn(), push = jest.fn(() => Promise.resolve(true))) => {
  jest.spyOn(spaces, 'useSpaceSafes').mockReturnValue({
    allSafes: [SAFE],
    isLoading: false,
    isError: false,
    error: undefined,
    refetch: jest.fn(),
  } as never)

  render(
    <TxModalContext.Provider value={{ txFlow: undefined, setTxFlow, setFullWidth: jest.fn() }}>
      <PoliciesBySafe />
    </TxModalContext.Provider>,
    { routerProps: { push, replace: jest.fn(() => Promise.resolve(true)), query: { spaceId: 'space-1' } } },
  )
  return { setTxFlow, push }
}

describe('PoliciesBySafe', () => {
  beforeEach(() => {
    mockedAvailable.mockReturnValue({ policies: CATALOGUE, isLoading: false, isError: false, refetch: jest.fn() })
    mockedActive.mockReturnValue({ policies: [], isLoading: false, isError: false, refetch: jest.fn() })
    mockPending()
  })

  afterEach(() => {
    for (const request of savePolicyRequestApi.get(SAFE.chainId, SAFE.address)) {
      savePolicyRequestApi.remove(SAFE.chainId, SAFE.address, request.id)
    }
    window.localStorage.clear()
    jest.restoreAllMocks()
  })

  it('leads with the Safe and nests the policy catalogue under it', () => {
    renderPage()

    expect(screen.getByText('Ops Safe')).toBeInTheDocument()
    expect(screen.getByText('0x1111...1111')).toBeInTheDocument()
    // A section per non-fallback catalogue entry…
    expect(screen.getByText('Token withdraw allowlist')).toBeInTheDocument()
    expect(screen.getByText('Spending limit')).toBeInTheDocument()
    expect(screen.getByText('Cosigner')).toBeInTheDocument()
    // …and the fallback types grouped under one slot, listed once expanded.
    expect(screen.getByText('Fallback')).toBeInTheDocument()
    expect(screen.getByText('only one applies at a time')).toBeInTheDocument()

    fireEvent.click(screen.getByText('Fallback'))
    expect(screen.getByText('Allow by default')).toBeInTheDocument()
    expect(screen.getByText('Deny by default')).toBeInTheDocument()
  })

  it('offers Add for an unconfigured policy type, with no badge cluttering the row', () => {
    renderPage()

    // The Add button carries the message; an empty-state badge would only add noise.
    expect(screen.queryByText('Not configured')).not.toBeInTheDocument()
    // One per configurable catalogue entry, fallback choices included.
    expect(screen.getAllByRole('button', { name: 'Add' }).length).toBeGreaterThan(1)

    fireEvent.click(screen.getByText('Token withdraw allowlist'))
    expect(screen.getByText('Not configured on this Safe yet.')).toBeInTheDocument()
  })

  // CGW returns `enforcement: null` for policies whose wiring it can't report; without
  // the addresses there is nothing to build a transaction against.
  it('disables Add when the catalogue reports no enforcement', () => {
    renderPage()

    fireEvent.click(screen.getByText('Fallback'))

    const disabled = screen.getAllByRole('button', { name: 'Add' }).filter((row) => row.hasAttribute('disabled'))

    // Only spending limit, whose enforcement CGW doesn't report. Every other type in this
    // catalogue has both enforcement and a builder.
    expect(disabled).toHaveLength(1)
  })

  it('explains why an unconfigurable policy is disabled', () => {
    renderPage()

    fireEvent.click(screen.getByText('Spending limit'))
    expect(screen.getByText(/Enforcement details are missing/)).toBeInTheDocument()
  })

  it('keeps Add enabled for a policy CGW can wire up', () => {
    renderPage()

    fireEvent.click(screen.getByText('Token withdraw allowlist'))
    // The section with enforcement is configurable, so its Add is live.
    const enabled = screen.getAllByRole('button', { name: 'Add' }).filter((row) => !row.hasAttribute('disabled'))
    expect(enabled.length).toBeGreaterThan(0)
  })

  // One flow serves all three fallback policies, so it needs to know which was clicked.
  it('opens the fallback builder with the chosen policy type', () => {
    const { push } = renderPage()

    fireEvent.click(screen.getByText('Fallback'))
    fireEvent.click(screen.getAllByRole('button', { name: 'Add' }).at(-1)!)

    expect(push).toHaveBeenCalledWith(
      expect.objectContaining({
        query: expect.objectContaining({ policy: 'fallback', fallbackType: PolicyType.Deny }),
      }),
    )
  })

  it('opens the cosigner builder, which the wallet now has', () => {
    const { push } = renderPage()

    fireEvent.click(screen.getByText('Cosigner'))
    const adds = screen.getAllByRole('button', { name: 'Add' }).filter((row) => !row.hasAttribute('disabled'))
    // Token withdraw and cosigner are both configurable.
    expect(adds).toHaveLength(2)

    fireEvent.click(adds[1])
    expect(push).toHaveBeenCalledWith(
      expect.objectContaining({ query: expect.objectContaining({ policy: 'cosigner' }) }),
    )
  })

  it('opens the builder for the clicked Safe, so the wizard need not ask again', () => {
    const { push } = renderPage()

    const [add] = screen.getAllByRole('button', { name: 'Add' }).filter((row) => !row.hasAttribute('disabled'))
    fireEvent.click(add)

    expect(push).toHaveBeenCalledWith(
      expect.objectContaining({
        query: expect.objectContaining({ policy: 'tokenWithdraw', policySafe: `${SAFE.chainId}:${SAFE.address}` }),
      }),
    )
  })

  it('lists an active policy under its type with a state chip', () => {
    const policy = tokenWithdrawPolicyBuilder()
      .with({ id: `0xa9059cbb${'0'.repeat(16)}${'1'.repeat(40)}` })
      .build()
    mockedActive.mockReturnValue({ policies: [policy], isLoading: false, isError: false, refetch: jest.fn() })

    renderPage()

    expect(screen.getAllByText('Active').length).toBeGreaterThan(0)
    expect(screen.getByText('1 active')).toBeInTheDocument()
  })

  // Regression: rows used to repeat their section's title, which told the reader nothing
  // and made four allowlist entries indistinguishable.
  it('labels entries by their token rather than repeating the policy type', () => {
    const usdc = { address: TOKEN, symbol: 'USDC', decimals: 6, logoUri: null }
    const dai = { address: '0x5555555555555555555555555555555555555555', symbol: 'DAI', decimals: 18, logoUri: null }
    mockedActive.mockReturnValue({
      policies: [
        tokenWithdrawPolicyBuilder()
          .with({
            id: `0xa9059cbb${'0'.repeat(16)}${'1'.repeat(40)}`,
            data: { allowlist: [{ token: usdc, recipients: [{ address: POLICY, name: null }] }] },
          })
          .build(),
        tokenWithdrawPolicyBuilder()
          .with({
            id: `0xa9059cbb${'0'.repeat(16)}${'5'.repeat(40)}`,
            data: {
              allowlist: [{ token: dai, recipients: [{ address: POLICY }, { address: GUARD }] }],
            },
          })
          .build(),
      ],
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    })

    renderPage()

    // Each row names its own token…
    expect(screen.getByText('USDC')).toBeInTheDocument()
    expect(screen.getByText('DAI')).toBeInTheDocument()
    // …and the recipient count no longer repeats the token count.
    expect(screen.getByText('1 allowed recipient')).toBeInTheDocument()
    expect(screen.getByText('2 allowed recipients')).toBeInTheDocument()
    // The type name appears once, on the section header.
    expect(screen.getAllByText('Token withdraw allowlist')).toHaveLength(1)
  })

  it('groups a catch-all policy under Fallback, badged', () => {
    const fallbackPolicy = tokenWithdrawPolicyBuilder()
      .with({ id: `0x${'0'.repeat(64)}` })
      .build()
    mockedActive.mockReturnValue({ policies: [fallbackPolicy], isLoading: false, isError: false, refetch: jest.fn() })

    renderPage()

    // The Fallback group holds it, so the type section stays empty.
    expect(screen.queryByText('No fallback policy on this Safe.')).not.toBeInTheDocument()
    expect(screen.getAllByText('Fallback').length).toBeGreaterThan(1)
  })

  it('says when a Safe has no fallback policy', () => {
    renderPage()

    fireEvent.click(screen.getByText('Fallback'))
    expect(screen.getByText('No fallback policy on this Safe.')).toBeInTheDocument()
  })

  describe('pending requests', () => {
    it('lists a pending request under its type and applies it', async () => {
      const request = saveRequest()
      const refetch = mockPending([
        { configureRoot: request.configureRoot, requestedAt: 1_000, readyAt: 1_001, isReady: true, policies: null },
      ])
      const { setTxFlow } = renderPage()

      expect(screen.getByText('Ready to apply')).toBeInTheDocument()

      fireEvent.click(screen.getByRole('button', { name: /apply/i }))
      await waitFor(() => expect(setTxFlow).toHaveBeenCalled())

      const txs = setTxFlow.mock.calls[0][0].props.txs
      expect(txs[0].to).toBe(GUARD)
      expect(() =>
        new Interface(APPLY_CONFIGURATION_ABI).decodeFunctionData('applyConfiguration', txs[0].data),
      ).not.toThrow()

      // The local snapshot is dropped and the list re-read on submission.
      setTxFlow.mock.calls[0][0].props.onSubmit({ txId: '0xtx' })
      expect(savePolicyRequestApi.get(SAFE.chainId, SAFE.address)).toEqual([])
      expect(refetch).toHaveBeenCalled()
    })

    it('blocks Apply when nothing holds the payload behind the root', () => {
      mockPending([
        {
          configureRoot: `0x${'ab'.repeat(32)}`,
          requestedAt: 1_000,
          readyAt: 1_001,
          isReady: true,
          policies: null,
        },
      ])
      renderPage()

      expect(screen.getByRole('button', { name: /apply/i })).toBeDisabled()
    })

    it('groups a pending change to the catch-all access under Fallback', () => {
      mockPending([
        {
          configureRoot: `0x${'cd'.repeat(32)}`,
          requestedAt: 1_000,
          readyAt: 1_001,
          isReady: true,
          policies: [
            {
              id: `0x${'11'.repeat(32)}`,
              target: ZERO_ADDRESS,
              selector: '0x00000000',
              operation: 'CALL' as const,
              policyContract: POLICY,
              data: '0x',
            },
          ],
        },
      ])
      renderPage()

      // Badged as the fallback, and not counted as a pending entry of a specific type.
      expect(screen.getAllByText('Fallback').length).toBeGreaterThan(1)
      fireEvent.click(screen.getByText('Token withdraw allowlist'))
      expect(screen.getByText('Not configured on this Safe yet.')).toBeInTheDocument()
    })

    it('opens the drawer with the request details on row click', async () => {
      const request = saveRequest()
      mockPending([
        { configureRoot: request.configureRoot, requestedAt: 1_000, readyAt: 1_001, isReady: true, policies: null },
      ])
      renderPage()

      fireEvent.click(screen.getByRole('button', { name: /details/i }))

      const drawer = within(await screen.findByRole('presentation'))
      expect(drawer.getByText('Root')).toBeInTheDocument()
      expect(drawer.getByText('USDC')).toBeInTheDocument()
    })
  })

  it('tells the user to add a Safe when the space has none', () => {
    jest.spyOn(spaces, 'useSpaceSafes').mockReturnValue({
      allSafes: [],
      isLoading: false,
      isError: false,
      error: undefined,
      refetch: jest.fn(),
    } as never)

    render(<PoliciesBySafe />)

    expect(screen.getByText('Add a Safe to this space to configure policies.')).toBeInTheDocument()
  })
})
