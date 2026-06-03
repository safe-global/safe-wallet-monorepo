import React from 'react'
import { act } from '@testing-library/react-native'
import { renderWithStore, createTestStore } from '@/src/tests/test-utils'
import { RequestSheetHost } from '../RequestSheetHost'
import { pushPending, walletKitSliceName } from '../../store/walletKitSlice'
import type { IWalletKit } from '@reown/walletkit'

const mockPresent = jest.fn()
const mockDismiss = jest.fn()

// Local mock to capture imperative present/dismiss (overrides the global bottom-sheet mock).
jest.mock('@gorhom/bottom-sheet', () => {
  const react = jest.requireActual('react')
  const { View } = jest.requireActual('react-native')
  const BottomSheetModal = react.forwardRef((props: { children?: React.ReactNode }, ref: React.Ref<unknown>) => {
    react.useImperativeHandle(ref, () => ({ present: mockPresent, dismiss: mockDismiss }))
    return <View>{props.children}</View>
  })
  return { __esModule: true, default: View, BottomSheetModal, BottomSheetModalProvider: View, BottomSheetView: View }
})

const fakeWalletKit = {} as IWalletKit

describe('RequestSheetHost', () => {
  beforeEach(() => {
    mockPresent.mockClear()
    mockDismiss.mockClear()
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
})
