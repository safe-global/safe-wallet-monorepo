import React from 'react'
import { act, fireEvent, waitFor } from '@testing-library/react-native'
import { getAddress } from 'ethers'
import { faker } from '@faker-js/faker'
import { getSdkError } from '@walletconnect/utils'
import { formatJsonRpcError } from '@walletconnect/jsonrpc-utils'
import { renderWithStore, createTestStore } from '@/src/tests/test-utils'
import { RequestSheetHost } from '../RequestSheetHost'
import { pushPending, selectPending, walletKitSliceName } from '../../store/walletKitSlice'
import type { RootState } from '@/src/store'
import type { IWalletKit, WalletKitTypes } from '@reown/walletkit'

const mockToastShow = jest.fn()
jest.mock('@tamagui/toast', () => ({ useToastController: () => ({ show: mockToastShow }) }))

const mockPresent = jest.fn()
const mockDismiss = jest.fn()
// Captures the latest onDismiss prop so tests can simulate a swipe-down / backdrop dismissal.
let mockOnDismiss: (() => void | Promise<void>) | undefined

// Local mock to capture imperative present/dismiss + render the footer (overrides the global mock).
jest.mock('@gorhom/bottom-sheet', () => {
  const react = jest.requireActual('react')
  const { View } = jest.requireActual('react-native')
  const BottomSheetModal = react.forwardRef(
    (
      props: {
        children?: React.ReactNode
        onDismiss?: () => void | Promise<void>
        footerComponent?: (p: object) => React.ReactNode
      },
      ref: React.Ref<unknown>,
    ) => {
      react.useImperativeHandle(ref, () => ({ present: mockPresent, dismiss: mockDismiss, snapToIndex: jest.fn() }))
      mockOnDismiss = props.onDismiss
      return (
        <View>
          {props.children}
          {props.footerComponent ? props.footerComponent({}) : null}
        </View>
      )
    },
  )
  return {
    __esModule: true,
    default: View,
    BottomSheetModal,
    BottomSheetModalProvider: View,
    BottomSheetView: View,
    BottomSheetScrollView: View,
    BottomSheetFooter: View,
  }
})

const mockRejectSession = jest.fn().mockResolvedValue(undefined)
const mockRespondSessionRequest = jest.fn().mockResolvedValue(undefined)
const fakeWalletKit = {
  rejectSession: mockRejectSession,
  respondSessionRequest: mockRespondSessionRequest,
} as unknown as IWalletKit

const safeAddress = getAddress(faker.finance.ethereumAddress()) as `0x${string}`

const fakeProposal = (id: number): WalletKitTypes.SessionProposal =>
  ({
    id,
    params: {
      proposer: { metadata: { name: 'dApp', url: 'https://dapp.test', icons: [] } },
      requiredNamespaces: { eip155: { chains: ['eip155:1'], methods: [], events: [] } },
      optionalNamespaces: {},
    },
    verifyContext: { verified: { validation: 'VALID' } },
  }) as unknown as WalletKitTypes.SessionProposal

const proposalStore = (id: number) =>
  createTestStore({
    activeSafe: { address: safeAddress, chainId: '1' },
    safes: { [safeAddress]: { '1': {} } },
    [walletKitSliceName]: {
      sessions: {},
      pending: [{ kind: 'proposal', id, proposal: fakeProposal(id) }],
      outstandingRequests: {},
    },
  } as never)

const getPending = (store: ReturnType<typeof createTestStore>) => selectPending(store.getState() as RootState)

describe('RequestSheetHost', () => {
  beforeEach(() => {
    mockPresent.mockClear()
    mockDismiss.mockClear()
    mockRejectSession.mockClear()
    mockRespondSessionRequest.mockClear()
    mockToastShow.mockClear()
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

  it('wires the footer Connect button to the approve flow', async () => {
    // Approve internals (namespaces, toast-on-failure, etc.) are covered by useApproveProposal's
    // own test; here we only assert the footer button is wired to it.
    const walletKit = {
      approveSession: jest.fn().mockResolvedValue({ topic: 'topic-1', namespaces: {} }),
      rejectSession: jest.fn().mockResolvedValue(undefined),
    } as unknown as IWalletKit & { approveSession: jest.Mock }
    const store = proposalStore(2)
    const { getByTestId } = renderWithStore(<RequestSheetHost walletKit={walletKit} />, store)

    fireEvent.press(getByTestId('wc-proposal-connect'))

    await waitFor(() => expect(walletKit.approveSession).toHaveBeenCalledTimes(1))
    expect(walletKit.approveSession.mock.calls[0][0].id).toBe(2)
    await waitFor(() => expect(getPending(store)).toHaveLength(0))
  })

  it('does not reject the proposal on dismiss while a connect is in flight', async () => {
    let resolveApprove!: (v: { topic: string; namespaces: object }) => void
    const approvePromise = new Promise<{ topic: string; namespaces: object }>((res) => {
      resolveApprove = res
    })
    const walletKit = {
      approveSession: jest.fn(() => approvePromise),
      rejectSession: jest.fn().mockResolvedValue(undefined),
    } as unknown as IWalletKit & { rejectSession: jest.Mock }
    const store = proposalStore(7)
    const { getByTestId } = renderWithStore(<RequestSheetHost walletKit={walletKit} />, store)

    // Start the connect (sets busy); approveSession stays pending.
    fireEvent.press(getByTestId('wc-proposal-connect'))

    // Dismissing mid-flight must NOT reject — approve owns the outcome.
    await act(async () => {
      await mockOnDismiss?.()
    })
    expect(walletKit.rejectSession).not.toHaveBeenCalled()

    // Let the in-flight approve settle so the promise isn't left dangling.
    await act(async () => {
      resolveApprove({ topic: 'topic-7', namespaces: {} })
      await approvePromise
    })
  })

  it('opens the permissions panel and swaps the footer CTA to "Got it", restoring Connect on dismiss', () => {
    const store = proposalStore(5)
    const { getByTestId, queryByTestId, getByText } = renderWithStore(
      <RequestSheetHost walletKit={fakeWalletKit} />,
      store,
    )

    // Proposal view: Connect in the footer.
    expect(getByTestId('wc-proposal-connect')).toBeTruthy()

    // Tapping the domain pill swaps in the permissions panel + the "Got it" footer.
    fireEvent.press(getByTestId('wc-proposal-domain'))
    expect(getByText('This domain has been verified.')).toBeTruthy()
    expect(getByTestId('wc-permissions-dismiss')).toBeTruthy()
    expect(queryByTestId('wc-proposal-connect')).toBeNull()

    // "Got it" returns to the proposal view.
    fireEvent.press(getByTestId('wc-permissions-dismiss'))
    expect(getByTestId('wc-proposal-connect')).toBeTruthy()
    expect(queryByTestId('wc-permissions-dismiss')).toBeNull()
  })

  it('rejects the proposal with USER_REJECTED when the sheet is dismissed', async () => {
    const store = createTestStore({
      [walletKitSliceName]: {
        sessions: {},
        pending: [{ kind: 'proposal', id: 2, proposal: fakeProposal(2) }],
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

  it('renders the Reject/Review footer for a tx request and wires Reject to USER_REJECTED', async () => {
    const store = createTestStore({
      activeSafe: { address: safeAddress, chainId: '1' },
      [walletKitSliceName]: {
        sessions: { 'topic-1': { peer: { metadata: { name: 'Uniswap', url: 'https://uniswap.org' } } } },
        pending: [
          { kind: 'request', id: 4, topic: 'topic-1', chainId: 'eip155:1', method: 'eth_sendTransaction', params: {} },
        ],
        outstandingRequests: {},
      },
    } as never)
    const { getByTestId } = renderWithStore(<RequestSheetHost walletKit={fakeWalletKit} />, store)

    expect(getByTestId('wc-tx-review')).toBeTruthy()
    fireEvent.press(getByTestId('wc-tx-reject'))

    await waitFor(() =>
      expect(mockRespondSessionRequest).toHaveBeenCalledWith({
        topic: 'topic-1',
        response: formatJsonRpcError(4, getSdkError('USER_REJECTED').message),
      }),
    )
    await waitFor(() => expect(getPending(store)).toHaveLength(0))
  })

  it('opens the permissions panel from the tx-request domain pill and restores Reject/Review on "Got it"', () => {
    const store = createTestStore({
      activeSafe: { address: safeAddress, chainId: '1' },
      [walletKitSliceName]: {
        sessions: { 'topic-1': { peer: { metadata: { name: 'Uniswap', url: 'https://uniswap.org' } } } },
        pending: [
          {
            kind: 'request',
            id: 6,
            topic: 'topic-1',
            chainId: 'eip155:1',
            method: 'eth_sendTransaction',
            params: {},
            verifyContext: { verified: { validation: 'VALID' } },
          },
        ],
        outstandingRequests: {},
      },
    } as never)
    const { getByTestId, queryByTestId, getByText } = renderWithStore(
      <RequestSheetHost walletKit={fakeWalletKit} />,
      store,
    )

    // Request view: Reject/Review in the footer.
    expect(getByTestId('wc-tx-review')).toBeTruthy()

    // Tapping the domain pill swaps in the permissions panel + the "Got it" footer.
    fireEvent.press(getByTestId('wc-tx-domain'))
    expect(getByText('This domain has been verified.')).toBeTruthy()
    expect(getByTestId('wc-permissions-dismiss')).toBeTruthy()
    expect(queryByTestId('wc-tx-review')).toBeNull()

    // "Got it" returns to the request view without responding to the dApp.
    fireEvent.press(getByTestId('wc-permissions-dismiss'))
    expect(getByTestId('wc-tx-review')).toBeTruthy()
    expect(mockRespondSessionRequest).not.toHaveBeenCalled()
    expect(getPending(store)).toHaveLength(1)
  })
})
