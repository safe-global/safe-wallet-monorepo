import React from 'react'
import { act } from '@testing-library/react-native'
import { getSdkError } from '@walletconnect/utils'
import { formatJsonRpcError } from '@walletconnect/jsonrpc-utils'
import { renderWithStore, createTestStore } from '@/src/tests/test-utils'
import { RequestSheetHost } from '../RequestSheetHost'
import { pushPending, selectPending, walletKitSliceName } from '../../store/walletKitSlice'
import type { RootState } from '@/src/store'
import type { IWalletKit, WalletKitTypes } from '@reown/walletkit'

jest.mock('@tamagui/toast', () => ({ useToastController: () => ({ show: jest.fn() }) }))

const mockPresent = jest.fn()
const mockDismiss = jest.fn()
// Captures the latest onDismiss prop so tests can simulate a swipe-down / backdrop dismissal.
let mockOnDismiss: (() => void | Promise<void>) | undefined

// Local mock to capture imperative present/dismiss + the onDismiss prop (overrides the global mock).
jest.mock('@gorhom/bottom-sheet', () => {
  const react = jest.requireActual('react')
  const { View } = jest.requireActual('react-native')
  const BottomSheetModal = react.forwardRef(
    (props: { children?: React.ReactNode; onDismiss?: () => void | Promise<void> }, ref: React.Ref<unknown>) => {
      react.useImperativeHandle(ref, () => ({ present: mockPresent, dismiss: mockDismiss }))
      mockOnDismiss = props.onDismiss
      return <View>{props.children}</View>
    },
  )
  return { __esModule: true, default: View, BottomSheetModal, BottomSheetModalProvider: View, BottomSheetView: View }
})

const mockRejectSession = jest.fn().mockResolvedValue(undefined)
const mockRespondSessionRequest = jest.fn().mockResolvedValue(undefined)
const fakeWalletKit = {
  rejectSession: mockRejectSession,
  respondSessionRequest: mockRespondSessionRequest,
} as unknown as IWalletKit

const getPending = (store: ReturnType<typeof createTestStore>) => selectPending(store.getState() as RootState)

describe('RequestSheetHost', () => {
  beforeEach(() => {
    mockPresent.mockClear()
    mockDismiss.mockClear()
    mockRejectSession.mockClear()
    mockRespondSessionRequest.mockClear()
    mockOnDismiss = undefined
  })

  it('never presents while pending is empty', () => {
    const store = createTestStore({
      [walletKitSliceName]: { sessions: {}, pending: [], outstandingRequests: {} },
    } as never)
    renderWithStore(<RequestSheetHost walletKit={fakeWalletKit} />, store)
    expect(mockPresent).not.toHaveBeenCalled()
  })

  it('presents when a request is enqueued', () => {
    const store = createTestStore({
      [walletKitSliceName]: { sessions: {}, pending: [], outstandingRequests: {} },
    } as never)
    renderWithStore(<RequestSheetHost walletKit={fakeWalletKit} />, store)

    act(() => {
      store.dispatch(
        pushPending({
          kind: 'request',
          id: 1,
          topic: 't',
          chainId: 'eip155:1',
          method: 'eth_sendTransaction',
          params: {},
        }),
      )
    })

    expect(mockPresent).toHaveBeenCalled()
  })

  it('dismisses when there is no current request', () => {
    const store = createTestStore({
      [walletKitSliceName]: {
        sessions: {},
        pending: [
          { kind: 'request', id: 1, topic: 't', chainId: 'eip155:1', method: 'eth_sendTransaction', params: {} },
        ],
        outstandingRequests: {},
      },
    } as never)
    renderWithStore(<RequestSheetHost walletKit={fakeWalletKit} />, store)
    mockPresent.mockClear()

    act(() => {
      store.dispatch({ type: 'walletKit/removePending', payload: { id: 1, kind: 'request' } })
    })

    expect(mockDismiss).toHaveBeenCalled()
  })

  it('rejects the proposal with USER_REJECTED when the sheet is dismissed', async () => {
    const fakeProposal = {
      id: 2,
      params: {
        proposer: { metadata: { name: 'dApp', url: 'https://dapp.test', icons: [] } },
        requiredNamespaces: { eip155: { chains: ['eip155:1'], methods: [], events: [] } },
        optionalNamespaces: {},
      },
      verifyContext: { verified: { validation: 'VALID' } },
    } as unknown as WalletKitTypes.SessionProposal
    const store = createTestStore({
      [walletKitSliceName]: {
        sessions: {},
        pending: [{ kind: 'proposal', id: 2, proposal: fakeProposal }],
        outstandingRequests: {},
      },
    } as never)
    renderWithStore(<RequestSheetHost walletKit={fakeWalletKit} />, store)

    await act(async () => {
      await mockOnDismiss?.()
    })

    expect(mockRejectSession).toHaveBeenCalledWith({ id: 2, reason: getSdkError('USER_REJECTED') })
    expect(mockRespondSessionRequest).not.toHaveBeenCalled()
    expect(getPending(store)).toHaveLength(0)
  })

  it('responds USER_REJECTED to a request when the sheet is dismissed', async () => {
    const store = createTestStore({
      [walletKitSliceName]: {
        sessions: {},
        pending: [
          { kind: 'request', id: 3, topic: 'topic-1', chainId: 'eip155:1', method: 'eth_sendTransaction', params: {} },
        ],
        outstandingRequests: {},
      },
    } as never)
    renderWithStore(<RequestSheetHost walletKit={fakeWalletKit} />, store)

    await act(async () => {
      await mockOnDismiss?.()
    })

    expect(mockRespondSessionRequest).toHaveBeenCalledWith({
      topic: 'topic-1',
      response: formatJsonRpcError(3, getSdkError('USER_REJECTED').message),
    })
    expect(mockRejectSession).not.toHaveBeenCalled()
    expect(getPending(store)).toHaveLength(0)
  })

  it('does nothing on dismiss when there is no current request', async () => {
    const store = createTestStore({
      [walletKitSliceName]: { sessions: {}, pending: [], outstandingRequests: {} },
    } as never)
    renderWithStore(<RequestSheetHost walletKit={fakeWalletKit} />, store)

    await act(async () => {
      await mockOnDismiss?.()
    })

    expect(mockRejectSession).not.toHaveBeenCalled()
    expect(mockRespondSessionRequest).not.toHaveBeenCalled()
  })
})
