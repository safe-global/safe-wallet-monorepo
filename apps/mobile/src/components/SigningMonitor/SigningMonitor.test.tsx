import React from 'react'
import { render } from '@testing-library/react-native'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { SigningMonitor } from './SigningMonitor'
import { usePathname } from 'expo-router'
import { useToastController } from '@tamagui/toast'
import signingStateReducer from '@/src/store/signingStateSlice'

// Mock dependencies
jest.mock('expo-router', () => ({
  usePathname: jest.fn(),
}))

jest.mock('@tamagui/toast', () => ({
  useToastController: jest.fn(),
}))

const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>
const mockUseToastController = useToastController as jest.MockedFunction<typeof useToastController>

describe('SigningMonitor', () => {
  const mockToast = {
    show: jest.fn(),
    hide: jest.fn(),
    nativeToast: null,
  }

  const createMockStore = (preloadedState?: { signingState: ReturnType<typeof signingStateReducer> }) => {
    return configureStore({
      reducer: {
        signingState: signingStateReducer,
      },
      preloadedState,
    })
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseToastController.mockReturnValue(mockToast)
  })

  it('shows success toast when signing completes and user is NOT on review screen', () => {
    mockUsePathname.mockReturnValue('/pending-transactions')

    const store = createMockStore({
      signingState: {
        signings: {
          tx123: { status: 'success', startedAt: Date.now() - 1000, completedAt: Date.now() },
        },
      },
    })

    render(
      <Provider store={store}>
        <SigningMonitor />
      </Provider>,
    )

    expect(mockToast.show).toHaveBeenCalledWith('Transaction signed successfully', {
      native: false,
      duration: 5000,
    })
  })

  it('shows error toast when signing fails and user is NOT on review screen', () => {
    mockUsePathname.mockReturnValue('/pending-transactions')

    const store = createMockStore({
      signingState: {
        signings: {
          tx456: { status: 'error', error: 'Network timeout', startedAt: Date.now() - 1000, completedAt: Date.now() },
        },
      },
    })

    render(
      <Provider store={store}>
        <SigningMonitor />
      </Provider>,
    )

    expect(mockToast.show).toHaveBeenCalledWith('Signing failed: Network timeout', {
      native: false,
      duration: 5000,
      variant: 'error',
    })
  })

  it('shows default error message when no error details provided', () => {
    mockUsePathname.mockReturnValue('/pending-transactions')

    const store = createMockStore({
      signingState: {
        signings: {
          tx789: { status: 'error', startedAt: Date.now() - 1000, completedAt: Date.now() },
        },
      },
    })

    render(
      <Provider store={store}>
        <SigningMonitor />
      </Provider>,
    )

    expect(mockToast.show).toHaveBeenCalledWith('Signing failed: Unknown error', {
      native: false,
      duration: 5000,
      variant: 'error',
    })
  })

  it('does NOT show toast when user is on review screen', () => {
    mockUsePathname.mockReturnValue('/review-and-confirm?txId=tx123')

    const store = createMockStore({
      signingState: {
        signings: {
          tx123: { status: 'success', startedAt: Date.now() - 1000, completedAt: Date.now() },
        },
      },
    })

    render(
      <Provider store={store}>
        <SigningMonitor />
      </Provider>,
    )

    expect(mockToast.show).not.toHaveBeenCalled()
  })

  it('clears signing state after processing', () => {
    mockUsePathname.mockReturnValue('/pending-transactions')

    const store = createMockStore({
      signingState: {
        signings: {
          tx123: { status: 'success', startedAt: Date.now() - 1000, completedAt: Date.now() },
        },
      },
    })

    render(
      <Provider store={store}>
        <SigningMonitor />
      </Provider>,
    )

    // After processing, state should be cleared
    const state = store.getState()
    expect(state.signingState.signings['tx123']).toBeUndefined()
  })

  it('handles multiple completions at once', () => {
    mockUsePathname.mockReturnValue('/pending-transactions')

    const store = createMockStore({
      signingState: {
        signings: {
          tx1: { status: 'success', startedAt: Date.now() - 1000, completedAt: Date.now() },
          tx2: { status: 'error', error: 'Failed', startedAt: Date.now() - 1000, completedAt: Date.now() },
        },
      },
    })

    render(
      <Provider store={store}>
        <SigningMonitor />
      </Provider>,
    )

    expect(mockToast.show).toHaveBeenCalledTimes(2)
    expect(mockToast.show).toHaveBeenCalledWith('Transaction signed successfully', expect.any(Object))
    expect(mockToast.show).toHaveBeenCalledWith('Signing failed: Failed', expect.any(Object))
  })

  it('does nothing when no completions', () => {
    mockUsePathname.mockReturnValue('/pending-transactions')

    const store = createMockStore({
      signingState: {
        signings: {},
      },
    })

    render(
      <Provider store={store}>
        <SigningMonitor />
      </Provider>,
    )

    expect(mockToast.show).not.toHaveBeenCalled()
  })

  it('renders nothing to the DOM', () => {
    mockUsePathname.mockReturnValue('/pending-transactions')

    const store = createMockStore({
      signingState: {
        signings: {},
      },
    })

    const { toJSON } = render(
      <Provider store={store}>
        <SigningMonitor />
      </Provider>,
    )

    expect(toJSON()).toBeNull()
  })

  it('handles navigation from review screen to history screen', () => {
    mockUsePathname.mockReturnValue('/history')

    const store = createMockStore({
      signingState: {
        signings: {
          tx123: { status: 'success', startedAt: Date.now() - 1000, completedAt: Date.now() },
        },
      },
    })

    render(
      <Provider store={store}>
        <SigningMonitor />
      </Provider>,
    )

    // Should show toast on history screen (not review screen)
    expect(mockToast.show).toHaveBeenCalledWith('Transaction signed successfully', expect.any(Object))
  })

  it('ignores signing transactions (not completed)', () => {
    mockUsePathname.mockReturnValue('/pending-transactions')

    const store = createMockStore({
      signingState: {
        signings: {
          tx123: { status: 'signing', startedAt: Date.now() },
        },
      },
    })

    render(
      <Provider store={store}>
        <SigningMonitor />
      </Provider>,
    )

    expect(mockToast.show).not.toHaveBeenCalled()
  })
})
