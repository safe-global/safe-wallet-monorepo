import { render, screen, fireEvent, waitFor, within } from '@/tests/test-utils'
import { Interface } from 'ethers'
import * as spaces from '@/features/spaces'
import { TxModalContext } from '@/components/tx-flow'
import { PolicyType, type PendingPolicy } from '@safe-global/store/gateway/policies/types'
import { tokenWithdrawPolicyBuilder } from '@/tests/builders/policies'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import { APPLY_CONFIGURATION_ABI, computeConfigureRoot } from '../shared/guardTx'
import { toConfigurations } from '../shared/applyPlan'
import { savePolicyRequestApi, type PolicyRequest } from '../policyRequestStore'
import { usePendingPolicies } from '../hooks/usePendingPolicies'
import PendingPoliciesList from '../PendingPoliciesList'

// Module-level (not spyOn): the `restoreAllMocks` in afterEach would otherwise swap the
// real hook back in while an async update is still queued, changing the hook count.
jest.mock('../hooks/usePendingPolicies')
const mockedUsePendingPolicies = jest.mocked(usePendingPolicies)

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
    // Self-consistent, like a real request: the root IS the hash of the configurations,
    // which is what `resolveApplyPlan` re-verifies before offering Apply.
    configureRoot: computeConfigureRoot([
      { target: TOKEN, selector: '0xa9059cbb', operation: 0, policy: POLICY, data: '0x' },
    ]),
    requestedAt: 1000,
    readyAt: 1000 + 86_400,
    delaySec: 86_400,
    ...overrides,
  }
  savePolicyRequestApi.save(req)
  return req
}

/** Mock what CGW reports as pending. `policy: null` mirrors a root it can't decode. */
const mockPending = (
  items: Array<{
    configureRoot: string
    readyAt?: number
    isReady?: boolean
    policy?: PendingPolicy['policy']
    policies?: PendingPolicy['policies']
    safePolicyGuard?: string
  }>,
) => {
  const refetch = jest.fn()
  mockedUsePendingPolicies.mockReturnValue({
    policies: items.map(({ configureRoot, readyAt, isReady, policy, policies, safePolicyGuard }) => ({
      configureRoot,
      requestedAt: 1000,
      readyAt: readyAt ?? 1000 + 86_400,
      isReady: isReady ?? false,
      policy: policy ?? null,
      policies: policies ?? null,
      safePolicyGuard,
    })),
    isLoading: false,
    isError: false,
    refetch,
  })
  return refetch
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
  beforeEach(() => {
    mockedUsePendingPolicies.mockReturnValue({ policies: [], isLoading: false, isError: false, refetch: jest.fn() })
  })

  afterEach(() => {
    jest.restoreAllMocks()
    // Purge the module-level store (survives localStorage.clear on its own).
    for (const r of savePolicyRequestApi.get(SAFE.chainId, SAFE.address)) {
      savePolicyRequestApi.remove(SAFE.chainId, SAFE.address, r.id)
    }
    window.localStorage.clear()
  })

  it('renders the Safe, policy info and config root for a pending request', () => {
    const req = saveRequest()
    mockPending([{ configureRoot: req.configureRoot }])
    renderList()

    expect(screen.getByText('Pending policies')).toBeInTheDocument()
    expect(screen.getByText('Ops Safe')).toBeInTheDocument()
    expect(screen.getByText(/1 token\(s\) · 1 recipient\(s\)/)).toBeInTheDocument()
    expect(screen.getByText(/^Root 0x/)).toBeInTheDocument()
  })

  it('disables Apply and shows a countdown while the delay has not elapsed', () => {
    const req = saveRequest()
    mockPending([{ configureRoot: req.configureRoot, readyAt: Math.floor(Date.now() / 1000) + 3600 }]) // 1h out
    renderList()

    expect(screen.getByRole('button', { name: /apply/i })).toBeDisabled()
    expect(screen.getByText(/ready in ~/i)).toBeInTheDocument()
  })

  it('enables Apply once ready and hands an applyConfiguration tx to the tx-flow', async () => {
    const req = saveRequest()
    mockPending([{ configureRoot: req.configureRoot, isReady: true }])
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

  it('removes the local snapshot and refetches when the apply tx is submitted', async () => {
    const req = saveRequest()
    const refetch = mockPending([{ configureRoot: req.configureRoot, isReady: true }])
    const { setTxFlow } = renderList()

    fireEvent.click(screen.getByRole('button', { name: /apply/i }))
    await waitFor(() => expect(setTxFlow).toHaveBeenCalled())

    // Simulate the tx-flow success callback.
    setTxFlow.mock.calls[0][0].props.onSubmit({ txId: '0xtx' })

    expect(savePolicyRequestApi.get(req.chainId, req.safeAddress)).toEqual([])
    expect(refetch).toHaveBeenCalled()
  })

  // Only CGW knows the root; the Configuration[] to replay lives with the requester.
  it('renders a CGW row with no local snapshot but cannot apply it', () => {
    mockPending([{ configureRoot: `0x${'ab'.repeat(32)}`, isReady: true }])
    renderList()

    expect(screen.getByText('Policy change')).toBeInTheDocument()
    expect(screen.getByText(/ready to apply/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /apply/i })).toBeDisabled()
  })

  it('labels the row from the decoded policy when CGW resolves it', () => {
    mockPending([
      {
        configureRoot: `0x${'cd'.repeat(32)}`,
        policy: tokenWithdrawPolicyBuilder().build(),
      },
    ])
    renderList()

    expect(screen.getByText('Token withdraw allowlist')).toBeInTheDocument()
  })

  // The signer who applies is usually not the requester, so CGW's bindings — not this
  // browser's snapshot — are what make Apply possible.
  describe('applying from CGW bindings', () => {
    const bindings = [
      {
        id: `0x${'11'.repeat(32)}`,
        target: TOKEN,
        selector: '0xa9059cbb',
        operation: 'CALL' as const,
        policyContract: POLICY,
        data: '0x01',
      },
    ]
    const rootOf = (items: typeof bindings) => computeConfigureRoot(toConfigurations(items))

    it('applies with no local snapshot, sending applyConfiguration to the returned guard', async () => {
      mockPending([{ configureRoot: rootOf(bindings), isReady: true, policies: bindings, safePolicyGuard: GUARD }])
      const { setTxFlow } = renderList()

      expect(screen.getByText('1 binding')).toBeInTheDocument()
      const applyBtn = screen.getByRole('button', { name: /apply/i })
      expect(applyBtn).toBeEnabled()

      fireEvent.click(applyBtn)
      await waitFor(() => expect(setTxFlow).toHaveBeenCalled())

      const txs = setTxFlow.mock.calls[0][0].props.txs
      expect(txs).toHaveLength(1)
      expect(txs[0].to).toBe(GUARD)
      expect(txs[0].value).toBe('0')

      // The proposed calldata carries exactly the rebuilt configurations.
      const [applied] = new Interface(APPLY_CONFIGURATION_ABI).decodeFunctionData('applyConfiguration', txs[0].data)
      expect(applied).toHaveLength(1)
      expect(applied[0].target.toLowerCase()).toBe(TOKEN.toLowerCase())
      expect(applied[0].data).toBe('0x01')
    })

    it('blocks Apply when the bindings do not hash to the root', () => {
      mockPending([
        {
          // Root of the untampered bindings, but the payload has been altered.
          configureRoot: rootOf(bindings),
          isReady: true,
          policies: [{ ...bindings[0], data: '0xdead' }],
          safePolicyGuard: GUARD,
        },
      ])
      renderList()

      expect(screen.getByRole('button', { name: /apply/i })).toBeDisabled()
    })

    // The live shape before CGW serves `data`: enough to describe the request, not to rebuild it.
    // Regression — this used to throw inside the ABI coder and take the whole page down.
    it('renders and disables Apply when the bindings omit the payload', () => {
      const { data: _data, ...withoutData } = bindings[0]
      mockPending([
        {
          configureRoot: rootOf(bindings),
          isReady: true,
          policies: [withoutData],
          safePolicyGuard: GUARD,
        },
      ])
      renderList()

      expect(screen.getByText('1 binding')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /apply/i })).toBeDisabled()
    })

    it('marks a request that touches the catch-all access', () => {
      mockPending([
        {
          configureRoot: `0x${'cd'.repeat(32)}`,
          isReady: true,
          policies: [{ ...bindings[0], target: ZERO_ADDRESS, selector: '0x00000000' }],
        },
      ])
      renderList()

      expect(screen.getByText('Fallback')).toBeInTheDocument()
    })

    it('does not mark a request bound to a specific access', () => {
      mockPending([{ configureRoot: rootOf(bindings), isReady: true, policies: bindings }])
      renderList()

      expect(screen.queryByText('Fallback')).not.toBeInTheDocument()
    })

    it('blocks Apply while the delay has not elapsed', () => {
      mockPending([
        {
          configureRoot: rootOf(bindings),
          readyAt: Math.floor(Date.now() / 1000) + 3600,
          policies: bindings,
          safePolicyGuard: GUARD,
        },
      ])
      renderList()

      expect(screen.getByRole('button', { name: /apply/i })).toBeDisabled()
      expect(screen.getByText(/ready in ~/i)).toBeInTheDocument()
    })
  })

  describe('the detail drawer', () => {
    const binding = {
      id: `0x${'11'.repeat(32)}`,
      target: TOKEN,
      selector: '0xa9059cbb',
      operation: 'CALL' as const,
      policyContract: POLICY,
      data: '0x01',
    }

    it('opens on row click, showing the request root and its bindings', async () => {
      mockPending([{ configureRoot: `0x${'cd'.repeat(32)}`, isReady: true, policies: [binding] }])
      renderList()

      fireEvent.click(screen.getByRole('button', { name: /details/i }))

      const drawer = await screen.findByRole('presentation')
      expect(drawer).toBeInTheDocument()
      // Request metadata plus one row per binding.
      expect(screen.getByText('Root')).toBeInTheDocument()
      expect(screen.getByText('Requested')).toBeInTheDocument()
      expect(screen.getByText('Rule 1')).toBeInTheDocument()
      expect(screen.getByText(/0xa9059cbb · CALL/)).toBeInTheDocument()
    })

    it('renders the token withdraw view from the local snapshot', async () => {
      const req = saveRequest()
      mockPending([{ configureRoot: req.configureRoot, isReady: true }])
      renderList()

      fireEvent.click(screen.getByRole('button', { name: /details/i }))

      // The label also appears on the row itself, so assert inside the drawer.
      const drawer = within(await screen.findByRole('presentation'))
      expect(drawer.getByText('Token withdraw allowlist')).toBeInTheDocument()
      expect(drawer.getByText('USDC')).toBeInTheDocument()
    })

    it('describes a fallback rule as applying to any transaction', async () => {
      mockPending([
        {
          configureRoot: `0x${'cd'.repeat(32)}`,
          isReady: true,
          policies: [{ ...binding, target: ZERO_ADDRESS, selector: '0x00000000' }],
        },
      ])
      renderList()

      fireEvent.click(screen.getByRole('button', { name: /details/i }))

      const drawer = within(await screen.findByRole('presentation'))
      expect(drawer.getByText('Any transaction')).toBeInTheDocument()
      expect(drawer.getAllByText('Fallback').length).toBeGreaterThan(0)
    })

    it('says so when no payload is known for the request', async () => {
      mockPending([{ configureRoot: `0x${'ef'.repeat(32)}`, isReady: true }])
      renderList()

      fireEvent.click(screen.getByRole('button', { name: /details/i }))

      expect(await screen.findByText(/Details unavailable/)).toBeInTheDocument()
    })

    // Apply sits inside the clickable row; clicking it must not also open the drawer.
    it('does not open when Apply is clicked', async () => {
      const req = saveRequest()
      mockPending([{ configureRoot: req.configureRoot, isReady: true }])
      const { setTxFlow } = renderList()

      fireEvent.click(screen.getByRole('button', { name: /apply/i }))

      await waitFor(() => expect(setTxFlow).toHaveBeenCalled())
      expect(screen.queryByRole('presentation')).not.toBeInTheDocument()
    })
  })

  it('renders nothing for a Safe with no pending changes', () => {
    mockPending([])
    renderList()

    expect(screen.queryByText('Ops Safe')).not.toBeInTheDocument()
  })
})
