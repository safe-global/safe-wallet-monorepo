import React from 'react'
import { render } from '@testing-library/react-native'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { useToastController } from '@tamagui/toast'
import { ToastMonitor } from './ToastMonitor'
import toastReducer, { type Toast } from '@/src/store/toastSlice'

jest.mock('@tamagui/toast', () => ({
  useToastController: jest.fn(),
}))

const mockUseToastController = useToastController as jest.MockedFunction<typeof useToastController>

const createStore = (queue: Toast[] = []) =>
  configureStore({
    reducer: { toast: toastReducer },
    preloadedState: { toast: { queue } },
  })

const renderMonitor = (store: ReturnType<typeof createStore>) =>
  render(
    <Provider store={store}>
      <ToastMonitor />
    </Provider>,
  )

describe('ToastMonitor', () => {
  const mockToast = { show: jest.fn(), hide: jest.fn(), nativeToast: null }

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseToastController.mockReturnValue(mockToast)
  })

  it('shows a queued toast and dismisses it from the queue', () => {
    const store = createStore([{ id: 'a', message: 'No signer attached to this Safe', duration: 2500 }])

    renderMonitor(store)

    expect(mockToast.show).toHaveBeenCalledWith('No signer attached to this Safe', {
      native: false,
      duration: 2500,
      variant: undefined,
    })
    expect(store.getState().toast.queue).toHaveLength(0)
  })

  it('forwards the error variant', () => {
    const store = createStore([{ id: 'b', message: 'Boom', variant: 'error' }])

    renderMonitor(store)

    expect(mockToast.show).toHaveBeenCalledWith('Boom', { native: false, duration: undefined, variant: 'error' })
  })

  it('shows every queued toast', () => {
    const store = createStore([
      { id: 'a', message: 'first' },
      { id: 'b', message: 'second' },
    ])

    renderMonitor(store)

    expect(mockToast.show).toHaveBeenCalledTimes(2)
    expect(store.getState().toast.queue).toHaveLength(0)
  })

  it('does nothing with an empty queue', () => {
    const store = createStore()

    renderMonitor(store)

    expect(mockToast.show).not.toHaveBeenCalled()
  })
})
