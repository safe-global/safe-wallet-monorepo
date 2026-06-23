import React from 'react'
import { waitFor } from '@testing-library/react-native'
import { renderWithStore, createTestStore } from '@/src/tests/test-utils'
import { WalletKitController } from '../WalletKitController'
import { walletKitSliceName } from '../store/walletKitSlice'
import type { IWalletKit } from '@reown/walletkit'

// Feature gate: on by default so the controller initialises; individual tests flip it off.
const mockUseHasFeature = jest.fn(() => true)
jest.mock('@/src/hooks/useHasFeature', () => ({ useHasFeature: () => mockUseHasFeature() }))

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
jest.mock('../components/RequestSheetHost', () => ({ RequestSheetHost: () => null }))
jest.mock('../hooks/useActiveSafeBinding', () => ({ useActiveSafeBinding: jest.fn() }))

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
  respondSessionRequest: jest.fn().mockResolvedValue(undefined),
} as unknown as IWalletKit & Record<string, jest.Mock>

const mockGetWalletKit = jest.fn(() => Promise.resolve(mockWalletKit))
jest.mock('../walletKit', () => ({ getWalletKit: () => mockGetWalletKit() }))

const renderController = () => {
  const store = createTestStore({
    [walletKitSliceName]: { sessions: {}, verifyByTopic: {}, pending: [], outstandingRequests: {} },
  } as never)
  const utils = renderWithStore(<WalletKitController />, store)
  return { store, ...utils }
}

describe('WalletKitController', () => {
  beforeEach(() => {
    mockUrlHandler = undefined
    listeners = {}
    jest.clearAllMocks()
    mockUseHasFeature.mockReturnValue(true)
    mockGetInitialURL.mockResolvedValue(null)
  })

  it('mounts without crashing', () => {
    expect(() => renderController()).not.toThrow()
  })

  it('seeds the slice from getActiveSessions on mount', async () => {
    const { store } = renderController()
    await waitFor(() => {
      expect(store.getState()[walletKitSliceName].sessions['seeded-topic']).toEqual(session)
    })
  })

  it('rejects restored tx requests with malformed params instead of seeding them', async () => {
    ;(mockWalletKit.getPendingSessionRequests as jest.Mock).mockReturnValueOnce([
      // Malformed: empty calls bundle — would crash extractCalls / compose downstream.
      {
        id: 11,
        topic: 'topic-bad',
        params: { chainId: 'eip155:1', request: { method: 'wallet_sendCalls', params: [{ calls: [] }] } },
      },
      // Valid: must still be seeded.
      {
        id: 12,
        topic: 'topic-ok',
        params: { chainId: 'eip155:1', request: { method: 'eth_sendTransaction', params: [{ to: '0xabc' }] } },
      },
    ])
    const { store } = renderController()
    await waitFor(() => {
      expect(store.getState()[walletKitSliceName].pending).toHaveLength(1)
    })
    expect(store.getState()[walletKitSliceName].pending[0]).toMatchObject({ id: 12, topic: 'topic-ok' })
    expect(mockWalletKit.respondSessionRequest).toHaveBeenCalledWith(
      expect.objectContaining({ topic: 'topic-bad', response: expect.objectContaining({ error: expect.anything() }) }),
    )
  })

  it('subscribes to all six session events', async () => {
    renderController()
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
    renderController()
    await waitFor(() => expect(mockUrlHandler).toBeDefined())
    mockUrlHandler?.({ url: 'wc:abc123@2?relay-protocol=irn' })
    await waitFor(() => expect(mockWalletKit.pair).toHaveBeenCalledWith({ uri: 'wc:abc123@2?relay-protocol=irn' }))
  })

  it('ignores non-wc deep links', async () => {
    renderController()
    await waitFor(() => expect(mockUrlHandler).toBeDefined())
    mockUrlHandler?.({ url: 'https://app.safe.global/foo' })
    // handleUrl returns early (synchronously) for non-wc: URLs; flush microtasks rather
    // than a real timer (global jest.useFakeTimers() would hang a setTimeout).
    await Promise.resolve()
    expect(mockWalletKit.pair).not.toHaveBeenCalled()
  })

  it('pairs on the initial URL when it is a wc: link', async () => {
    mockGetInitialURL.mockResolvedValue('wc:initial@2')
    renderController()
    await waitFor(() => expect(mockWalletKit.pair).toHaveBeenCalledWith({ uri: 'wc:initial@2' }))
  })

  it('rejects session_authenticate', async () => {
    renderController()
    await waitFor(() => expect(listeners['session_authenticate']).toBeDefined())
    listeners['session_authenticate']({ id: 42 })
    await waitFor(() =>
      expect(mockWalletKit.rejectSessionAuthenticate).toHaveBeenCalledWith(expect.objectContaining({ id: 42 })),
    )
  })

  it('does not initialise WalletKit when the feature flag is off', async () => {
    mockUseHasFeature.mockReturnValue(false)
    renderController()
    // Give the (skipped) init effect a chance to run.
    await Promise.resolve()
    expect(mockGetWalletKit).not.toHaveBeenCalled()
    expect(mockWalletKit.on).not.toHaveBeenCalled()
  })

  it('treats an undefined flag (no active safe) as off', async () => {
    mockUseHasFeature.mockReturnValue(undefined as unknown as boolean)
    renderController()
    await Promise.resolve()
    expect(mockGetWalletKit).not.toHaveBeenCalled()
  })

  it('tears down listeners when the feature flag flips off', async () => {
    const store = createTestStore({
      [walletKitSliceName]: { sessions: {}, verifyByTopic: {}, pending: [], outstandingRequests: {} },
    } as never)
    const { rerender } = renderWithStore(<WalletKitController />, store)
    await waitFor(() => expect(listeners['session_request']).toBeDefined())

    mockUseHasFeature.mockReturnValue(false)
    rerender(<WalletKitController />)

    await waitFor(() => expect(mockWalletKit.off).toHaveBeenCalledWith('session_request', expect.any(Function)))
  })
})
