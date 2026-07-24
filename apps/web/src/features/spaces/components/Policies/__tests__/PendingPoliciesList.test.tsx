import { render, screen, fireEvent, waitFor } from '@/tests/test-utils'
import { Interface } from 'ethers'
import * as spaces from '@/features/spaces'
import { TxModalContext } from '@/components/tx-flow'
import { PolicyType } from '@safe-global/store/gateway/policies/types'
import { APPLY_CONFIGURATION_ABI } from '../shared/guardTx'
import { savePolicyRequestApi, type PolicyRequest } from '../policyRequestStore'
import PendingPoliciesList from '../PendingPoliciesList'

const SAFE = { chainId: '11155111', address: '0x1111111111111111111111111111111111111111', name: 'Ops Safe' }
const GUARD = '0x2222222222222222222222222222222222222222'
const POLICY = '0x3333333333333333333333333333333333333333'
const TOKEN = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
const RECIPIENT = '0xdead00000000000000000000000000000000de01'

jest.mock('@/hooks/useChains', () => ({
  __esModule: true,
  default: () => ({ configs: [{ chainId: '11155111', shortName: 'sep' }] }),
  useChain: () => undefined,
}))

let idCounter = 0

const saveRequest = (overrides: Partial<PolicyRequest> = {}): PolicyRequest => {
  const req: PolicyRequest = {
    id: `root-${++idCounter}`,
    chainId: SAFE.chainId,
    safeAddress: SAFE.address,
    type: PolicyType.TokenWithdraw,
    enforcement: { via: 'guard', guards: { transactionGuard: { policyContract: POLICY, safePolicyGuard: GUARD } } },
    data: {
      allowlist: [
        {
          token: { address: TOKEN, symbol: 'USDC', decimals: 6 },
          recipients: [{ address: RECIPIENT, name: null }],
        },
      ],
    },
    configurations: [{ target: TOKEN, selector: '0xa9059cbb', operation: 0, policy: POLICY, data: '0x' }],
    configureRoot: `0x${idCounter.toString(16).padStart(64, '0')}`,
    requestedAt: 1000,
    readyAt: 1000 + 86_400,
    delaySec: 86_400,
    ...overrides,
  }
  savePolicyRequestApi.save(req)
  return req
}

const renderList = (setTxFlow = jest.fn(), replace = jest.fn(() => Promise.resolve(true))) => {
  jest.spyOn(spaces, 'useSpaceSafes').mockReturnValue({
    allSafes: [SAFE],
    isLoading: false,
    isError: false,
    error: undefined,
    refetch: jest.fn(),
  } as never)

  render(
    <TxModalContext.Provider value={{ txFlow: undefined, setTxFlow, setFullWidth: jest.fn() }}>
      <PendingPoliciesList />
    </TxModalContext.Provider>,
    { routerProps: { replace } },
  )
  return { setTxFlow, replace }
}

describe('PendingPoliciesList', () => {
  afterEach(() => {
    jest.restoreAllMocks()
    // Purge the module-level store (survives localStorage.clear on its own).
    for (const r of savePolicyRequestApi.get(SAFE.chainId, SAFE.address)) {
      savePolicyRequestApi.remove(SAFE.chainId, SAFE.address, r.id)
    }
    window.localStorage.clear()
  })

  it('renders the Safe, policy info and config root for a pending request', () => {
    saveRequest()
    renderList()

    expect(screen.getByText('Pending policies')).toBeInTheDocument()
    expect(screen.getByText('Ops Safe')).toBeInTheDocument()
    expect(screen.getByText(/1 token\(s\) · 1 recipient\(s\)/)).toBeInTheDocument()
    expect(screen.getByText(/^Root 0x/)).toBeInTheDocument()
  })

  it('disables Apply and shows a countdown while the delay has not elapsed', () => {
    saveRequest({ readyAt: Math.floor(Date.now() / 1000) + 3600 }) // 1h out
    renderList()

    expect(screen.getByRole('button', { name: /apply/i })).toBeDisabled()
    expect(screen.getByText(/ready in ~/i)).toBeInTheDocument()
  })

  it('enables Apply once ready and hands an applyConfiguration tx to the tx-flow', async () => {
    saveRequest({ readyAt: Math.floor(Date.now() / 1000) - 1 }) // already ready
    const { setTxFlow, replace } = renderList()

    expect(screen.getByText(/ready to apply/i)).toBeInTheDocument()
    const applyBtn = screen.getByRole('button', { name: /apply/i })
    expect(applyBtn).toBeEnabled()

    fireEvent.click(applyBtn)

    // Navigates into the Safe, then opens the flow with the apply tx.
    await waitFor(() => expect(setTxFlow).toHaveBeenCalled())
    expect(replace).toHaveBeenCalledWith(
      expect.objectContaining({ query: expect.objectContaining({ safe: `sep:${SAFE.address}` }) }),
      undefined,
      { shallow: true },
    )

    const flowEl = setTxFlow.mock.calls[0][0]
    expect(flowEl.props.subtitle).toBe('Apply token withdraw change')
    const txs = flowEl.props.txs
    expect(txs).toHaveLength(1)
    expect(txs[0].to).toBe(GUARD)
    expect(() =>
      new Interface(APPLY_CONFIGURATION_ABI).decodeFunctionData('applyConfiguration', txs[0].data),
    ).not.toThrow()
  })

  it('removes the pending request when the apply tx is submitted', async () => {
    const req = saveRequest({ readyAt: Math.floor(Date.now() / 1000) - 1 })
    const { setTxFlow } = renderList()

    fireEvent.click(screen.getByRole('button', { name: /apply/i }))
    await waitFor(() => expect(setTxFlow).toHaveBeenCalled())

    // Simulate the tx-flow success callback.
    setTxFlow.mock.calls[0][0].props.onSubmit({ txId: '0xtx' })

    expect(savePolicyRequestApi.get(req.chainId, req.safeAddress)).toEqual([])
  })
})
