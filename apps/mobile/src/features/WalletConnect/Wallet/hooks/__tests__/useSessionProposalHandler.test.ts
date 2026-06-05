import { getAddress } from 'ethers'
import { faker } from '@faker-js/faker'
import { getSdkError } from '@walletconnect/utils'
import type { WalletKitTypes, IWalletKit } from '@reown/walletkit'
import { renderHookWithStore, createTestStore, waitFor } from '@/src/tests/test-utils'
import { useSessionProposalHandler } from '../useSessionProposalHandler'
import { selectPending, walletKitSliceName } from '../../store/walletKitSlice'
import type { RootState } from '@/src/store'

const mockToastShow = jest.fn()
jest.mock('@tamagui/toast', () => ({ useToastController: () => ({ show: mockToastShow }) }))

const safeAddress = getAddress(faker.finance.ethereumAddress()) as `0x${string}`

// Capture the registered session_proposal listener so tests can invoke it directly.
const makeWalletKit = () => {
  let listener: ((p: WalletKitTypes.SessionProposal) => void) | undefined
  const wk = {
    on: jest.fn((event: string, cb: (p: WalletKitTypes.SessionProposal) => void) => {
      if (event === 'session_proposal') listener = cb
    }),
    off: jest.fn(),
    rejectSession: jest.fn().mockResolvedValue(undefined),
  }
  return {
    wk: wk as unknown as IWalletKit,
    rejectSession: wk.rejectSession,
    emit: (p: WalletKitTypes.SessionProposal) => listener?.(p),
  }
}

const makeProposal = (params: Record<string, unknown>): WalletKitTypes.SessionProposal =>
  ({
    id: 123,
    params,
    verifyContext: { verified: { validation: 'VALID' } },
  }) as unknown as WalletKitTypes.SessionProposal

const eip155Proposal = (required: string[], optional: string[] = []): Record<string, unknown> => ({
  proposer: { metadata: { name: 'dApp', url: 'https://dapp.test', icons: [] } },
  requiredNamespaces: { eip155: { chains: required, methods: [], events: [] } },
  optionalNamespaces: optional.length ? { eip155: { chains: optional, methods: [], events: [] } } : {},
})

// Store seeded with an active Safe on chain 1 that is deployed on chains 1 and 137.
const seededStore = () =>
  createTestStore({
    activeSafe: { address: safeAddress, chainId: '1' },
    safes: { [safeAddress]: { '1': {}, '137': {} } } as never,
  })

describe('useSessionProposalHandler', () => {
  it('does nothing without a walletKit', () => {
    const store = seededStore()
    renderHookWithStore(() => useSessionProposalHandler(null), store)
    // No throw; nothing registered.
  })

  it('auto-rejects with USER_REJECTED when there is no active Safe', async () => {
    const { wk, rejectSession, emit } = makeWalletKit()
    const store = createTestStore({})
    renderHookWithStore(() => useSessionProposalHandler(wk), store)
    emit(makeProposal(eip155Proposal(['eip155:1'])))
    await waitFor(() => expect(rejectSession).toHaveBeenCalledWith({ id: 123, reason: getSdkError('USER_REJECTED') }))
  })

  it('auto-rejects with UNSUPPORTED_NAMESPACE_KEY for a non-eip155 required namespace', async () => {
    const { wk, rejectSession, emit } = makeWalletKit()
    renderHookWithStore(() => useSessionProposalHandler(wk), seededStore())
    emit(
      makeProposal({
        proposer: { metadata: { name: 'dApp', url: 'https://dapp.test', icons: [] } },
        requiredNamespaces: { solana: { chains: ['solana:1'], methods: [], events: [] } },
        optionalNamespaces: {},
      }),
    )
    await waitFor(() =>
      expect(rejectSession).toHaveBeenCalledWith({ id: 123, reason: getSdkError('UNSUPPORTED_NAMESPACE_KEY') }),
    )
  })

  it('auto-rejects with UNSUPPORTED_CHAINS for a required chain the Safe is not on', async () => {
    const { wk, rejectSession, emit } = makeWalletKit()
    renderHookWithStore(() => useSessionProposalHandler(wk), seededStore())
    emit(makeProposal(eip155Proposal(['eip155:10']))) // Optimism, not deployed
    await waitFor(() =>
      expect(rejectSession).toHaveBeenCalledWith({ id: 123, reason: getSdkError('UNSUPPORTED_CHAINS') }),
    )
  })

  it('auto-rejects with UNSUPPORTED_CHAINS when the dApp does not support the active chain', async () => {
    const { wk, rejectSession, emit } = makeWalletKit()
    // Active Safe on chain 1, also deployed on 137; dApp only lists 137 -> active chain unsupported.
    const { result } = renderHookWithStore(() => useSessionProposalHandler(wk), seededStore())
    void result
    emit(makeProposal(eip155Proposal(['eip155:137'])))
    await waitFor(() =>
      expect(rejectSession).toHaveBeenCalledWith({ id: 123, reason: getSdkError('UNSUPPORTED_CHAINS') }),
    )
    // The toast is what distinguishes this path from the required-chain reject above.
    expect(mockToastShow).toHaveBeenCalledWith(expect.stringContaining("doesn't support"), expect.anything())
  })

  it('pushes a compatible proposal to the slice', async () => {
    const { wk, rejectSession, emit } = makeWalletKit()
    const store = seededStore()
    renderHookWithStore(() => useSessionProposalHandler(wk), store)
    emit(makeProposal(eip155Proposal(['eip155:1'])))
    await waitFor(() => {
      const pending = selectPending(store.getState() as RootState)
      expect(pending).toHaveLength(1)
      expect(pending[0]).toMatchObject({ kind: 'proposal', id: 123 })
    })
    expect(rejectSession).not.toHaveBeenCalled()
  })
})
