import React from 'react'
import { Text } from 'react-native'
import { waitFor } from '@testing-library/react-native'
import { renderWithStore, createTestStore } from '@/src/tests/test-utils'
import { WalletKitProvider } from '../WalletKitProvider'
import { walletKitSliceName } from '../../store/walletKitSlice'
import type { IWalletKit } from '@reown/walletkit'

// expo-linking: capture the registered url handler so we can fire events manually.
// Variables referenced inside jest.mock factories must be named with mock* prefix (Jest hoisting rule).
let mockUrlHandler: ((e: { url: string }) => void) | undefined
const mockGetInitialURL = jest.fn().mockResolvedValue(null)
const mockRemoveSub = jest.fn()
jest.mock('expo-linking', () => ({
  addEventListener: jest.fn((_type: string, cb: (e: { url: string }) => void) => {
    mockUrlHandler = cb
    return { remove: mockRemoveSub }
  }),
  getInitialURL: () => mockGetInitialURL(),
}))

// Isolate from the heavy children — covered by their own tests.
jest.mock('../../components/RequestSheetHost', () => ({ RequestSheetHost: () => null }))
jest.mock('../../hooks/useActiveSafeBinding', () => ({ useActiveSafeBinding: jest.fn() }))

let listeners: Record<string, (arg: unknown) => void> = {}
const session = { topic: 'seeded-topic' }
const mockWalletKit = {
  getActiveSessions: jest.fn(() => ({ 'seeded-topic': session })),
  getPendingSessionRequests: jest.fn(() => []),
  on: jest.fn((event: string, cb: (arg: unknown) => void) => {
    listeners[event] = cb
  }),
  off: jest.fn(),
  pair: jest.fn().mockResolvedValue(undefined),
  rejectSessionAuthenticate: jest.fn().mockResolvedValue(undefined),
} as unknown as IWalletKit & Record<string, jest.Mock>

jest.mock('../../walletKit', () => ({ getWalletKit: jest.fn(() => Promise.resolve(mockWalletKit)) }))

const renderProvider = () => {
  const store = createTestStore({
    [walletKitSliceName]: { sessions: {}, pending: [], outstandingRequests: {} },
  } as never)
  const utils = renderWithStore(
    <WalletKitProvider>
      <Text>child</Text>
    </WalletKitProvider>,
    store,
  )
  return { store, ...utils }
}

describe('WalletKitProvider', () => {
  beforeEach(() => {
    mockUrlHandler = undefined
    listeners = {}
    jest.clearAllMocks()
    mockGetInitialURL.mockResolvedValue(null)
  })

  it('renders children', () => {
    const { getByText } = renderProvider()
    expect(getByText('child')).toBeTruthy()
  })

  it('seeds the slice from getActiveSessions on mount', async () => {
    const { store } = renderProvider()
    await waitFor(() => {
      expect(store.getState()[walletKitSliceName].sessions['seeded-topic']).toEqual(session)
    })
  })

  it('subscribes to all six session events', async () => {
    renderProvider()
    await waitFor(() => expect(mockWalletKit.on).toHaveBeenCalled())
    const events = (mockWalletKit.on as jest.Mock).mock.calls.map((c) => c[0])
    expect(events).toEqual(
      expect.arrayContaining([
        'session_proposal',
        'session_request',
        'session_delete',
        'proposal_expire',
        'session_request_expire',
        'session_authenticate',
      ]),
    )
  })

  it('pairs on a foregrounded wc: deep link', async () => {
    renderProvider()
    await waitFor(() => expect(mockUrlHandler).toBeDefined())
    mockUrlHandler?.({ url: 'wc:abc123@2?relay-protocol=irn' })
    await waitFor(() => expect(mockWalletKit.pair).toHaveBeenCalledWith({ uri: 'wc:abc123@2?relay-protocol=irn' }))
  })

  it('ignores non-wc deep links', async () => {
    renderProvider()
    await waitFor(() => expect(mockUrlHandler).toBeDefined())
    mockUrlHandler?.({ url: 'https://app.safe.global/foo' })
    // handleUrl returns early (synchronously) for non-wc: URLs; flush microtasks rather
    // than a real timer (global jest.useFakeTimers() would hang a setTimeout).
    await Promise.resolve()
    expect(mockWalletKit.pair).not.toHaveBeenCalled()
  })

  it('pairs on the initial URL when it is a wc: link', async () => {
    mockGetInitialURL.mockResolvedValue('wc:initial@2')
    renderProvider()
    await waitFor(() => expect(mockWalletKit.pair).toHaveBeenCalledWith({ uri: 'wc:initial@2' }))
  })

  it('rejects session_authenticate', async () => {
    renderProvider()
    await waitFor(() => expect(listeners['session_authenticate']).toBeDefined())
    listeners['session_authenticate']({ id: 42 })
    await waitFor(() =>
      expect(mockWalletKit.rejectSessionAuthenticate).toHaveBeenCalledWith(expect.objectContaining({ id: 42 })),
    )
  })
})
