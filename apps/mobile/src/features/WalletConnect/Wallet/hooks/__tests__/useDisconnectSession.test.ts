import { act } from '@testing-library/react-native'
import { getSdkError } from '@walletconnect/utils'
import type { SessionTypes } from '@walletconnect/types'
import { renderHookWithStore, createTestStore } from '@/src/tests/test-utils'
import { useDisconnectSession } from '../useDisconnectSession'
import { selectSessionsRecord } from '../../store/walletKitSlice'
import type { RootState } from '@/src/store'

const mockToastShow = jest.fn()
jest.mock('@tamagui/toast', () => ({ useToastController: () => ({ show: mockToastShow }) }))

const mockDisconnectSession = jest.fn()
jest.mock('../../walletKit', () => ({
  getWalletKit: () => Promise.resolve({ disconnectSession: mockDisconnectSession }),
}))

const session = (topic: string): SessionTypes.Struct =>
  ({ topic, peer: { metadata: { name: 'dApp' } } }) as unknown as SessionTypes.Struct

const storeWithSession = (topic: string) =>
  createTestStore({
    walletKit: {
      sessions: { [topic]: session(topic) },
      verifyByTopic: { [topic]: 'verified' },
      pending: [],
      outstandingRequests: {},
    },
  } as never)

describe('useDisconnectSession', () => {
  beforeEach(() => {
    mockToastShow.mockClear()
    mockDisconnectSession.mockReset()
  })

  it('tells the relay and removes the session from the slice on success', async () => {
    mockDisconnectSession.mockResolvedValue(undefined)
    const store = storeWithSession('topic-1')
    const { result } = renderHookWithStore(() => useDisconnectSession(), store)

    await act(async () => {
      await result.current.disconnect('topic-1', 'dApp')
    })

    expect(mockDisconnectSession).toHaveBeenCalledWith({
      topic: 'topic-1',
      reason: getSdkError('USER_DISCONNECTED'),
    })
    expect(selectSessionsRecord(store.getState() as RootState)['topic-1']).toBeUndefined()
    expect(mockToastShow).toHaveBeenCalledWith('dApp disconnected', expect.anything())
    expect(result.current.busyTopic).toBeNull()
  })

  it('keeps the session and shows an error toast when the relay call fails', async () => {
    mockDisconnectSession.mockRejectedValue(new Error('relay down'))
    const store = storeWithSession('topic-2')
    const { result } = renderHookWithStore(() => useDisconnectSession(), store)

    await act(async () => {
      await result.current.disconnect('topic-2', 'dApp')
    })

    expect(selectSessionsRecord(store.getState() as RootState)['topic-2']).toBeDefined()
    expect(mockToastShow).toHaveBeenCalledWith('Failed to disconnect', expect.objectContaining({ variant: 'error' }))
    expect(result.current.busyTopic).toBeNull()
  })
})
