import { render, screen, fireEvent, waitFor } from '@/tests/test-utils'
import { Interface, AbiCoder } from 'ethers'
import * as spaces from '@/features/spaces'
import * as availableHook from '../../hooks/useAvailablePolicies'
import * as activeHook from '../../hooks/useActivePolicies'
import * as guardHook from '../../hooks/usePolicyGuard'
import * as storeRequestHook from '../../hooks/useStorePolicyRequest'
import * as balancesApi from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import * as tokenList from '../../SpendingLimitFlow/tokenList'
import * as useChainsHook from '@/hooks/useChains'
import { TxModalContext } from '@/components/tx-flow'
import { PolicyType } from '@safe-global/store/gateway/policies/types'
import { availablePolicyBuilder, tokenWithdrawPolicyBuilder } from '@/tests/builders/policies'
import { SAFE_SET_GUARD_ABI, CONFIGURE_IMMEDIATELY_ABI, REQUEST_CONFIGURATION_ABI } from '../../shared/guardTx'
import { ERC20_TRANSFER_SELECTOR, RECIPIENT_DATA_TYPE } from '../contracts'
import ERC20TransferPolicyFlow from '../index'

const SAFE = { chainId: '1', address: '0x1111111111111111111111111111111111111111', name: 'Ops Safe' }
const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
const RECIPIENT = '0xdead00000000000000000000000000000000de01'
const GUARD = '0x2222222222222222222222222222222222222222'
const POLICY = '0x3333333333333333333333333333333333333333'

type MockOptions = {
  /** CGW returns `enforcement: null` on catalogue entries it has no wiring for. */
  catalogueEnforcement?: 'guard' | null
  /** The Safe's active token-withdraw policy, which carries the live addresses. */
  activeEnforcement?: 'guard' | null
}

const mockAll = (guardOverrides = {}, options: MockOptions = {}) => {
  const { catalogueEnforcement = 'guard', activeEnforcement = null } = options
  jest.spyOn(spaces, 'useSpaceSafes').mockReturnValue({
    allSafes: [SAFE],
    isLoading: false,
    isError: false,
    error: undefined,
    refetch: jest.fn(),
  } as never)

  const guardEnforcement = {
    via: 'guard' as const,
    guards: { transactionGuard: { policyContract: POLICY, safePolicyGuard: GUARD } },
  }

  jest.spyOn(availableHook, 'useAvailablePolicies').mockReturnValue({
    policies: [
      availablePolicyBuilder()
        .with({
          type: PolicyType.TokenWithdraw,
          enforcement: catalogueEnforcement === 'guard' ? guardEnforcement : null,
        })
        .build(),
    ],
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
  })

  jest.spyOn(activeHook, 'useActivePolicies').mockReturnValue({
    policies:
      activeEnforcement === 'guard'
        ? [tokenWithdrawPolicyBuilder().with({ enforcement: guardEnforcement }).build()]
        : [],
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
  })

  const storePolicyRequest = jest.fn().mockResolvedValue({ ok: true })
  jest.spyOn(storeRequestHook, 'useStorePolicyRequest').mockReturnValue(storePolicyRequest)

  jest.spyOn(guardHook, 'usePolicyGuard').mockReturnValue({
    currentGuard: undefined,
    isSet: false,
    isUnknownGuard: false,
    isLoading: false,
    ...guardOverrides,
  })

  jest.spyOn(balancesApi, 'useBalancesGetBalancesV1Query').mockReturnValue({
    data: { items: [{ tokenInfo: { address: USDC, symbol: 'USDC', decimals: 6, logoUri: null } }] },
  } as never)

  jest.spyOn(tokenList, 'tokensForChain').mockResolvedValue([])

  jest.spyOn(useChainsHook, 'default').mockReturnValue({
    configs: [{ chainId: SAFE.chainId, shortName: 'eth' }],
  } as never)

  return { storePolicyRequest }
}

const renderFlow = (setTxFlow = jest.fn()) => {
  const replace = jest.fn(() => Promise.resolve(true))
  render(
    <TxModalContext.Provider value={{ txFlow: undefined, setTxFlow, setFullWidth: jest.fn() }}>
      <ERC20TransferPolicyFlow />
    </TxModalContext.Provider>,
    { routerProps: { replace } },
  )
  return { setTxFlow, replace }
}

describe('ERC20TransferPolicyFlow', () => {
  afterEach(() => jest.restoreAllMocks())

  it('starts on the Apply-to step listing the space safes; Continue disabled until a safe is picked', async () => {
    mockAll()
    renderFlow()

    expect(screen.getByText('Which Safe does this apply to?')).toBeInTheDocument()
    expect(screen.getByText('Ops Safe')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /continue/i })).toBeDisabled()
    await flush()
  })

  it('walks safe → tokens → recipients → review and hands a batch to the tx-flow modal', async () => {
    mockAll()
    const { setTxFlow } = renderFlow()
    await advanceToReview()

    // Review shows the summary; the CTA builds the batch and opens PolicyBatchFlow.
    fireEvent.click(screen.getByRole('button', { name: /review/i }))
    await waitFor(() => expect(setTxFlow).toHaveBeenCalledTimes(1))
  })

  it('switches the URL to the selected Safe before opening the flow (so the tx-flow SDK resolves it)', async () => {
    mockAll()
    const { setTxFlow, replace } = renderFlow()
    await advanceToReview()

    fireEvent.click(screen.getByRole('button', { name: /review/i }))

    // The active Safe is set in the URL (shallow) ahead of the modal opening.
    await waitFor(() =>
      expect(replace).toHaveBeenCalledWith(
        expect.objectContaining({ query: expect.objectContaining({ safe: `eth:${SAFE.address}` }) }),
        undefined,
        { shallow: true },
      ),
    )
    expect(setTxFlow).toHaveBeenCalled()
  })

  it('hands PolicyBatchFlow the exact setGuard + configureImmediately calldata', async () => {
    mockAll()
    const { setTxFlow } = renderFlow()
    await advanceToReview()
    fireEvent.click(screen.getByRole('button', { name: /review/i }))
    await waitFor(() => expect(setTxFlow).toHaveBeenCalled())

    const flowEl = setTxFlow.mock.calls[0][0]
    expect(flowEl.props.subtitle).toBe('Token withdraw allowlist')

    const txs = flowEl.props.txs
    expect(txs).toHaveLength(2)

    // Tx 1 — setGuard(GUARD) as a call to the Safe itself.
    expect(txs[0].to).toBe(SAFE.address)
    expect(txs[0].value).toBe('0')
    const [guardArg] = new Interface(SAFE_SET_GUARD_ABI).decodeFunctionData('setGuard', txs[0].data)
    expect(guardArg.toLowerCase()).toBe(GUARD.toLowerCase())

    // Tx 2 — configureImmediately on the guard with the ERC20TransferPolicy Configuration.
    expect(txs[1].to).toBe(GUARD)
    expect(txs[1].value).toBe('0')
    const [configs] = new Interface(CONFIGURE_IMMEDIATELY_ABI).decodeFunctionData('configureImmediately', txs[1].data)
    expect(configs).toHaveLength(1)
    const [target, selector, operation, policy, data] = configs[0]
    expect(target.toLowerCase()).toBe(USDC.toLowerCase())
    expect(selector).toBe(ERC20_TRANSFER_SELECTOR)
    expect(Number(operation)).toBe(0)
    expect(policy.toLowerCase()).toBe(POLICY.toLowerCase())

    const recipients = AbiCoder.defaultAbiCoder().decode([RECIPIENT_DATA_TYPE], data)[0]
    expect(recipients).toHaveLength(1)
    expect(recipients[0][0].toLowerCase()).toBe(RECIPIENT.toLowerCase())
    expect(recipients[0][1]).toBe(true)
  })

  it('requests a delayed change (no setGuard, no configureImmediately) when the guard is already active', async () => {
    mockAll({ currentGuard: GUARD, isSet: true }) // guard already installed
    const { setTxFlow } = renderFlow()
    await advanceToReview()

    // Review warns that the change is time-locked.
    expect(screen.getByText(/time-locked/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /review/i }))
    await waitFor(() => expect(setTxFlow).toHaveBeenCalled())

    const flowEl = setTxFlow.mock.calls[0][0]
    expect(flowEl.props.subtitle).toBe('Request token withdraw change')

    const txs = flowEl.props.txs
    expect(txs).toHaveLength(1)
    expect(txs[0].to).toBe(GUARD)
    // It's requestConfiguration, not configureImmediately.
    expect(() =>
      new Interface(REQUEST_CONFIGURATION_ABI).decodeFunctionData('requestConfiguration', txs[0].data),
    ).not.toThrow()
    expect(() =>
      new Interface(CONFIGURE_IMMEDIATELY_ABI).decodeFunctionData('configureImmediately', txs[0].data),
    ).toThrow()
  })

  it('shows the unknown-guard warning on Review when a foreign guard is set', async () => {
    mockAll({ currentGuard: '0x9999999999999999999999999999999999999999', isUnknownGuard: true })
    renderFlow()
    await advanceToReview()
    expect(screen.getByText(/already has a different transaction guard/i)).toBeInTheDocument()
  })

  it('lets the user add a custom token by contract address', async () => {
    const CUSTOM = '0xcccc00000000000000000000000000000000cccc'
    mockAll()
    renderFlow()

    // Get to the tokens step.
    fireEvent.click(screen.getByText('Ops Safe'))
    fireEvent.click(screen.getByRole('button', { name: /continue/i }))
    await screen.findByText('USDC')

    const addTokenBtn = screen.getByRole('button', { name: /add token/i })
    expect(addTokenBtn).toBeDisabled() // empty input

    // Invalid address keeps it disabled.
    fireEvent.change(screen.getByLabelText('Custom token address'), { target: { value: '0xnope' } })
    expect(addTokenBtn).toBeDisabled()

    // Valid address enables it; adding selects the token and lets Continue proceed.
    fireEvent.change(screen.getByLabelText('Custom token address'), { target: { value: CUSTOM } })
    expect(addTokenBtn).toBeEnabled()
    fireEvent.click(addTokenBtn)

    // The custom token now renders (shortened, checksummed) and Continue is enabled.
    expect(screen.getByText((t) => t.toLowerCase() === '0xcccc...cccc')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /continue/i })).toBeEnabled()
  })

  it('Review shows the full config: safe, token, and recipient', async () => {
    mockAll()
    renderFlow()
    await advanceToReview()

    expect(screen.getByText('Ops Safe')).toBeInTheDocument()
    expect(screen.getByText('0x1111...1111')).toBeInTheDocument()
    expect(screen.getByText('USDC')).toBeInTheDocument()
    expect(screen.getByText('0xA0b8...eB48')).toBeInTheDocument()
    expect(screen.getByText('0xdead...de01')).toBeInTheDocument()
    expect(screen.getByText('Token')).toBeInTheDocument()
    expect(screen.getByText('Recipient')).toBeInTheDocument()
  })

  // CGW currently reports `enforcement: null` for every catalogue entry, so the addresses
  // have to come from the Safe's active policy of the same type.
  it('falls back to the active policy addresses when the catalogue reports no enforcement', async () => {
    mockAll({}, { catalogueEnforcement: null, activeEnforcement: 'guard' })
    const { setTxFlow } = renderFlow()
    await advanceToReview()

    expect(screen.getByRole('button', { name: /review/i })).toBeEnabled()
    fireEvent.click(screen.getByRole('button', { name: /review/i }))

    await waitFor(() => expect(setTxFlow).toHaveBeenCalled())
    // Built against the guard from the active policy.
    expect(setTxFlow.mock.calls[0][0].props.txs[1].to).toBe(GUARD)
  })

  it('blocks Review with an explanation when neither source has the policy contracts', async () => {
    mockAll({}, { catalogueEnforcement: null, activeEnforcement: null })
    const { setTxFlow } = renderFlow()
    await advanceToReview()

    expect(screen.getByText(/policy engine isn't available/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /review/i })).toBeDisabled()
    expect(setTxFlow).not.toHaveBeenCalled()
  })
})

/**
 * `requestConfiguration` publishes only the root, so the wallet has to hand CGW the
 * Configuration[] — before the transaction is proposed, and without ever blocking it.
 */
describe('ERC20TransferPolicyFlow — storing the configuration in CGW', () => {
  afterEach(() => jest.restoreAllMocks())

  it('stores the configurations with the same root the tx commits to, before proposing', async () => {
    // Guard already installed → the delayed request path, which creates a pending row.
    const { storePolicyRequest } = mockAll({ currentGuard: GUARD, isSet: true })
    const { setTxFlow } = renderFlow()
    await advanceToReview()

    fireEvent.click(screen.getByRole('button', { name: /review/i }))
    await waitFor(() => expect(setTxFlow).toHaveBeenCalled())

    expect(storePolicyRequest).toHaveBeenCalledTimes(1)
    const stored = storePolicyRequest.mock.calls[0][0]
    expect(stored).toEqual(
      expect.objectContaining({ chainId: SAFE.chainId, safeAddress: SAFE.address, root: expect.any(String) }),
    )
    expect(stored.configurations.length).toBeGreaterThan(0)

    // Same root in the stored row and in requestConfiguration — one value, used twice.
    const [onChainRoot] = new Interface(REQUEST_CONFIGURATION_ABI).decodeFunctionData(
      'requestConfiguration',
      setTxFlow.mock.calls[0][0].props.txs[0].data,
    )
    expect(onChainRoot).toBe(stored.root)

    // Stored before the tx-flow opened, i.e. before the tx is proposed.
    expect(storePolicyRequest.mock.invocationCallOrder[0]).toBeLessThan(setTxFlow.mock.invocationCallOrder[0])
  })

  it('still proposes the transaction when the store call fails', async () => {
    const { storePolicyRequest } = mockAll({ currentGuard: GUARD, isSet: true })
    storePolicyRequest.mockResolvedValue({ ok: false, isCapReached: false })
    const { setTxFlow } = renderFlow()
    await advanceToReview()

    fireEvent.click(screen.getByRole('button', { name: /review/i }))

    await waitFor(() => expect(setTxFlow).toHaveBeenCalled())
  })

  // An immediate config takes effect in the same batch, so it never becomes a pending row.
  it('does not store anything on the immediate path', async () => {
    const { storePolicyRequest } = mockAll()
    const { setTxFlow } = renderFlow()
    await advanceToReview()

    fireEvent.click(screen.getByRole('button', { name: /review/i }))
    await waitFor(() => expect(setTxFlow).toHaveBeenCalled())

    expect(storePolicyRequest).not.toHaveBeenCalled()
  })
})

// --- helpers ---

/** Flush pending async state (e.g. tokensForChain useAsync) inside act(). */
const flush = () => waitFor(() => expect(screen.getByText('Ops Safe')).toBeInTheDocument())

async function advanceToReview() {
  fireEvent.click(screen.getByText('Ops Safe'))
  fireEvent.click(screen.getByRole('button', { name: /continue/i })) // -> tokens
  fireEvent.click(await screen.findByText('USDC'))
  fireEvent.click(screen.getByRole('button', { name: /continue/i })) // -> recipients
  fireEvent.change(screen.getByLabelText('recipient 1'), { target: { value: RECIPIENT } })
  fireEvent.click(screen.getByRole('button', { name: /continue/i })) // -> review
}
