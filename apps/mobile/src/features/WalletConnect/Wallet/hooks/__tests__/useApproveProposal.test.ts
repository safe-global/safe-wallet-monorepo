import { getAddress } from 'ethers'
import { faker } from '@faker-js/faker'
import { act } from '@testing-library/react-native'
import { getSdkError } from '@walletconnect/utils'
import type { IWalletKit, WalletKitTypes } from '@reown/walletkit'
import { renderHookWithStore, createTestStore } from '@/src/tests/test-utils'
import { useApproveProposal } from '../useApproveProposal'
import { selectSessions, selectPending } from '../../store/walletKitSlice'
import type { RootState } from '@/src/store'

const mockToastShow = jest.fn()
jest.mock('@tamagui/toast', () => ({ useToastController: () => ({ show: mockToastShow }) }))

const safeAddress = getAddress(faker.finance.ethereumAddress()) as `0x${string}`

const makePending = (id: number): { id: number; proposal: WalletKitTypes.SessionProposal } => ({
  id,
  proposal: {
    id,
    params: {
      proposer: { metadata: { name: 'dApp', url: 'https://dapp.test', icons: [] } },
      requiredNamespaces: { eip155: { chains: ['eip155:1'], methods: [], events: [] } },
      optionalNamespaces: {},
    },
  } as unknown as WalletKitTypes.SessionProposal,
})

const storeWithSafe = () =>
  createTestStore({
    activeSafe: { address: safeAddress, chainId: '1' },
    safes: { [safeAddress]: { '1': {} } } as never,
  })

describe('useApproveProposal', () => {
  beforeEach(() => mockToastShow.mockClear())

  it('approves the proposal, stores the session, and clears the pending item', async () => {
    const session = { topic: 'topic-1', namespaces: {} }
    const wk = {
      approveSession: jest.fn().mockResolvedValue(session),
      rejectSession: jest.fn().mockResolvedValue(undefined),
    } as unknown as IWalletKit & { approveSession: jest.Mock }
    const store = storeWithSafe()
    const { result } = renderHookWithStore(() => useApproveProposal(wk), store)

    await act(async () => {
      await result.current.approve(makePending(2))
    })

    expect(wk.approveSession).toHaveBeenCalledTimes(1)
    const arg = wk.approveSession.mock.calls[0][0]
    expect(arg.id).toBe(2)
    expect(arg.namespaces.eip155.accounts).toEqual(['eip155:1:' + safeAddress])
    expect(arg.sessionProperties).toBeDefined()
    expect(selectSessions(store.getState() as RootState)).toHaveLength(1)
    expect(selectPending(store.getState() as RootState)).toHaveLength(0)
  })

  it('shows a toast and rejects when approveSession fails', async () => {
    const wk = {
      approveSession: jest.fn().mockRejectedValue(new Error('boom')),
      rejectSession: jest.fn().mockResolvedValue(undefined),
    } as unknown as IWalletKit & { rejectSession: jest.Mock }
    const { result } = renderHookWithStore(() => useApproveProposal(wk), storeWithSafe())

    await act(async () => {
      await result.current.approve(makePending(3))
    })

    expect(mockToastShow).toHaveBeenCalledWith('boom', expect.anything())
    expect(wk.rejectSession).toHaveBeenCalledWith({ id: 3, reason: getSdkError('USER_REJECTED') })
  })

  it('rejects without approving when there is no active Safe', async () => {
    const wk = {
      approveSession: jest.fn(),
      rejectSession: jest.fn().mockResolvedValue(undefined),
    } as unknown as IWalletKit & { approveSession: jest.Mock; rejectSession: jest.Mock }
    const { result } = renderHookWithStore(() => useApproveProposal(wk), createTestStore({}))

    await act(async () => {
      await result.current.approve(makePending(4))
    })

    expect(wk.rejectSession).toHaveBeenCalledWith({ id: 4, reason: getSdkError('USER_REJECTED') })
    expect(wk.approveSession).not.toHaveBeenCalled()
  })
})
