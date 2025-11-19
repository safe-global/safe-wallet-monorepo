import { listenerMiddlewareInstance } from '@/store'
import { swapOrderStatusListener, setSwapOrder, deleteSwapOrder } from '@/store/swapOrderSlice'
import * as notificationsSlice from '@/store/notificationsSlice'

import { type TypedStartListening } from '@reduxjs/toolkit'
import { type RootState, type AppDispatch } from '@/store' // adjust the import path as needed

type StartListeningType = TypedStartListening<RootState, AppDispatch> & {
  withTypes: () => TypedStartListening<RootState, AppDispatch>
} & jest.Mock
const createStartListeningMock = () => {
  const mock = jest.fn() as unknown as StartListeningType
  mock.withTypes = jest.fn().mockReturnValue(mock)
  return mock
}
describe('swapOrderSlice', () => {
  // TODO: These tests are disabled because txHistorySlice was deleted and migrated to RTK Query
  // These tests need to be refactored to mock the RTK Query hook instead
  describe.skip('swapOrderListener', () => {
    it('should not dispatch an event if the transaction is not a swapTx', () => {})
    it('should not dispatch an event if the swapOrder status did not change', () => {})
    it('should dispatch setSwapOrder if the swapOrder status changed', () => {})
    it('should not dispatch setSwapOrder if the old status is undefined and new status is fulfilled, expired, or cancelled', () => {})
  })

  describe('swapOrderStatusListener', () => {
    const listenerMiddleware = listenerMiddlewareInstance
    const mockDispatch = jest.fn()
    const showNotificationSpy = jest.spyOn(notificationsSlice, 'showNotification')
    const startListeningMock = createStartListeningMock()

    beforeEach(() => {
      jest.clearAllMocks()
      listenerMiddleware.startListening = startListeningMock
      swapOrderStatusListener(listenerMiddleware)
    })

    it('should dispatch a notification if the swapOrder status is created and threshold is 1', () => {
      const swapOrder = {
        orderUid: 'order1',
        status: 'created' as const,
        txId: '0x123',
        chainId: '1',
        safeAddress: '0xSafeAddress',
      }

      const action = setSwapOrder(swapOrder)

      const effect = startListeningMock.mock.calls[0][0].effect
      effect(action, {
        dispatch: mockDispatch,
        getState: () => ({
          api: {
            queries: {
              'safesGetSafeV1({"chainId":"1","safeAddress":"0xSafeAddress"})': {
                data: {
                  threshold: 1,
                  address: { value: '0xSafeAddress' },
                },
              },
              'chainsGetChainsV1(undefined)': {
                data: {
                  results: [{ chainId: '1' }],
                },
              },
            },
          },
        }),
        getOriginalState: () => ({
          swapOrders: {},
        }),
      })

      expect(showNotificationSpy).toHaveBeenCalledWith({
        title: 'Order created',
        message: 'Waiting for the transaction to be executed',
        groupKey: 'swap-order-status',
        variant: 'info',
        link: expect.any(Object),
      })
    })

    it('should dispatch a notification if the swapOrder status is created and there is nothing about this swap in the state and threshold is more than 1', () => {
      const swapOrder = {
        orderUid: 'order1',
        status: 'created' as const,
        txId: '0x123',
        chainId: '1',
        safeAddress: '0xSafeAddress',
      }

      const action = setSwapOrder(swapOrder)

      const effect = startListeningMock.mock.calls[0][0].effect
      effect(action, {
        dispatch: mockDispatch,
        getState: () => ({
          api: {
            queries: {
              'safesGetSafeV1({"chainId":"1","safeAddress":"0xSafeAddress"})': {
                data: {
                  threshold: 2,
                  address: { value: '0xSafeAddress' },
                },
              },
              'chainsGetChainsV1(undefined)': {
                data: {
                  results: [{ chainId: '1' }],
                },
              },
            },
          },
        }),
        getOriginalState: () => ({
          swapOrders: {},
        }),
      })

      expect(showNotificationSpy).toHaveBeenCalledWith({
        title: 'Order created',
        message: 'Waiting for confirmation from signers of your Safe',
        groupKey: 'swap-order-status',
        variant: 'info',
        link: expect.any(Object),
      })
    })

    it('should dispatch a notification if the swapOrder status is open and we have old status and threshold is 1', () => {
      const swapOrder = {
        orderUid: 'order1',
        status: 'open' as const,
        txId: '0x123',
        chainId: '1',
        safeAddress: '0xSafeAddress',
      }

      const action = setSwapOrder(swapOrder)

      const effect = startListeningMock.mock.calls[0][0].effect
      effect(action, {
        dispatch: mockDispatch,
        getState: () => ({
          api: {
            queries: {
              'safesGetSafeV1({"chainId":"1","safeAddress":"0xSafeAddress"})': {
                data: {
                  threshold: 1,
                  address: { value: '0xSafeAddress' },
                },
              },
              'chainsGetChainsV1(undefined)': {
                data: {
                  results: [{ chainId: '1' }],
                },
              },
            },
          },
        }),
        getOriginalState: () => ({
          swapOrders: {
            order1: {
              orderUid: 'order1',
              status: 'created', // Old status is not undefined
            },
          },
        }),
      })

      expect(showNotificationSpy).toHaveBeenCalledWith({
        title: 'Order transaction confirmed',
        message: 'Waiting for order execution by the CoW Protocol',
        groupKey: 'swap-order-status',
        variant: 'info',
        link: expect.any(Object),
      })
    })

    it('should dispatch a notification if the swapOrder status is presignaturePending', () => {
      const swapOrder = {
        orderUid: 'order1',
        status: 'presignaturePending' as const,
        txId: '0x123',
      }

      const action = setSwapOrder(swapOrder)

      const effect = startListeningMock.mock.calls[0][0].effect
      effect(action, {
        dispatch: mockDispatch,
        getState: () => ({}),
        getOriginalState: () => ({
          swapOrders: {},
        }),
      })

      expect(showNotificationSpy).toHaveBeenCalledWith({
        title: 'Order waiting for signature',
        message: 'Waiting for confirmation from signers of your Safe',
        groupKey: 'swap-order-status',
        variant: 'info',
        link: undefined,
      })
    })

    it('should dispatch a notification if the swapOrder status is open', () => {
      const swapOrder = {
        orderUid: 'order1',
        status: 'open' as const,
        txId: '0x123',
      }

      const action = setSwapOrder(swapOrder)

      const effect = startListeningMock.mock.calls[0][0].effect
      effect(action, {
        dispatch: mockDispatch,
        getState: () => ({}),
        getOriginalState: () => ({
          swapOrders: {},
        }),
      })

      expect(showNotificationSpy).toHaveBeenCalledWith({
        title: 'Order transaction confirmed',
        message: 'Waiting for order execution by the CoW Protocol',
        groupKey: 'swap-order-status',
        variant: 'info',
        link: undefined,
      })
    })

    it('should not dispatch a notification if the swapOrder status is fulfilled and old status is undefined', () => {
      const swapOrder = {
        orderUid: 'order1',
        status: 'fulfilled' as const,
        txId: '0x123',
      }

      const action = setSwapOrder(swapOrder)

      const effect = startListeningMock.mock.calls[0][0].effect
      effect(action, {
        dispatch: mockDispatch,
        getState: () => ({}),
        getOriginalState: () => ({
          swapOrders: {},
        }),
      })

      expect(showNotificationSpy).not.toHaveBeenCalled()
    })

    it('should dispatch a notification if the swapOrder status is fulfilled and old status is not undefined', () => {
      const swapOrder = {
        orderUid: 'order1',
        status: 'fulfilled' as const,
        txId: '0x123',
      }

      const action = setSwapOrder(swapOrder)

      const effect = startListeningMock.mock.calls[0][0].effect
      effect(action, {
        dispatch: mockDispatch,
        getState: () => ({}),
        getOriginalState: () => ({
          swapOrders: {
            order1: {
              orderUid: 'order1',
              status: 'open',
            },
          },
        }),
      })

      expect(showNotificationSpy).toHaveBeenCalledWith({
        title: 'Order executed',
        message: 'Your order has been successful',
        groupKey: 'swap-order-status',
        variant: 'success',
        link: undefined,
      })

      expect(mockDispatch).toHaveBeenCalledWith(deleteSwapOrder('order1'))
    })

    it('should not dispatch a notification if the swapOrder status is expired and old status is undefined', () => {
      const swapOrder = {
        orderUid: 'order1',
        status: 'expired' as const,
        txId: '0x123',
      }

      const action = setSwapOrder(swapOrder)

      const effect = startListeningMock.mock.calls[0][0].effect
      effect(action, {
        dispatch: mockDispatch,
        getState: () => ({}),
        getOriginalState: () => ({
          swapOrders: {},
        }),
      })

      expect(showNotificationSpy).not.toHaveBeenCalled()
      expect(mockDispatch).toHaveBeenCalledWith(deleteSwapOrder('order1'))
    })

    it('should dispatch a notification if the swapOrder status is expired and old status is not undefined', () => {
      const swapOrder = {
        orderUid: 'order1',
        status: 'expired' as const,
        txId: '0x123',
      }

      const action = setSwapOrder(swapOrder)

      const effect = startListeningMock.mock.calls[0][0].effect
      effect(action, {
        dispatch: mockDispatch,
        getState: () => ({}),
        getOriginalState: () => ({
          swapOrders: {
            order1: {
              orderUid: 'order1',
              status: 'open',
            },
          },
        }),
      })

      expect(showNotificationSpy).toHaveBeenCalledWith({
        title: 'Order expired',
        message: 'Your order has reached the expiry time and has become invalid',
        groupKey: 'swap-order-status',
        variant: 'warning',
        link: undefined,
      })

      expect(mockDispatch).toHaveBeenCalledWith(deleteSwapOrder('order1'))
    })

    it('should not dispatch a notification if the swapOrder status is cancelled and old status is undefined', () => {
      const swapOrder = {
        orderUid: 'order1',
        status: 'cancelled' as const,
        txId: '0x123',
      }

      const action = setSwapOrder(swapOrder)

      const effect = startListeningMock.mock.calls[0][0].effect
      effect(action, {
        dispatch: mockDispatch,
        getState: () => ({}),
        getOriginalState: () => ({
          swapOrders: {},
        }),
      })

      expect(showNotificationSpy).not.toHaveBeenCalled()
      expect(mockDispatch).toHaveBeenCalledWith(deleteSwapOrder('order1'))
    })

    it('should dispatch a notification if the swapOrder status is cancelled and old status is not undefined', () => {
      const swapOrder = {
        orderUid: 'order1',
        status: 'cancelled' as const,
        txId: '0x123',
      }

      const action = setSwapOrder(swapOrder)

      const effect = startListeningMock.mock.calls[0][0].effect
      effect(action, {
        dispatch: mockDispatch,
        getState: () => ({}),
        getOriginalState: () => ({
          swapOrders: {
            order1: {
              orderUid: 'order1',
              status: 'open',
            },
          },
        }),
      })

      expect(showNotificationSpy).toHaveBeenCalledWith({
        title: 'Order cancelled',
        message: 'Your order has been cancelled',
        groupKey: 'swap-order-status',
        variant: 'warning',
        link: undefined,
      })
      expect(mockDispatch).toHaveBeenCalledWith(deleteSwapOrder('order1'))
    })
  })
})
