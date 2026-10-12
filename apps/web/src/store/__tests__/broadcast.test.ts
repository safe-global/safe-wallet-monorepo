import { makeStore } from '..'
import { listenToBroadcast } from '../broadcast'

describe('broadcast middleware', () => {
  beforeEach(() => {
    function BroadcastChannel() {}
    BroadcastChannel.prototype = {
      addEventListener: jest.fn(),
      postMessage: jest.fn(),
      close: jest.fn(),
    }
    global.BroadcastChannel = BroadcastChannel as any
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('broadcastState', () => {
    it('should broadcast specific slice updates', () => {
      const store = makeStore()
      const action = { type: 'addressBook/removeAddressBookEntry', payload: {} }

      listenToBroadcast(store)

      store.dispatch(action)

      jest.spyOn(global.BroadcastChannel.prototype, 'postMessage')

      expect(global.BroadcastChannel.prototype.postMessage).toHaveBeenCalledWith({
        action,
        tabId: expect.any(String),
      })
    })

    it('should not broadcast if slice not in list', () => {
      const store = makeStore()
      const action = { type: 'otherSlice/someAction', payload: {} }

      listenToBroadcast(store)

      store.dispatch(action)

      jest.spyOn(global.BroadcastChannel.prototype, 'postMessage')

      expect(global.BroadcastChannel.prototype.postMessage).not.toHaveBeenCalled()
    })

    it('should not broadcast already broadcasted actions', () => {
      const store = makeStore()
      const action = { type: 'addressBook/removeAddressBookEntry', payload: {}, _isBroadcasted: true }

      listenToBroadcast(store)

      store.dispatch(action)

      jest.spyOn(global.BroadcastChannel.prototype, 'postMessage')

      expect(global.BroadcastChannel.prototype.postMessage).not.toHaveBeenCalled()
    })
  })

  describe('listenToBroadcast', () => {
    it('should dispatch action when receiving broadcast from another tab', () => {
      const store = makeStore()
      const action = { type: 'addressBook/removeAddressBookEntry', payload: {} }

      listenToBroadcast(store)

      const event = new Event('message')
      const data = { action, tabId: 'anotherTab' }
      Object.defineProperty(event, 'data', { value: data })
      ;(global.BroadcastChannel as any).prototype.addEventListener.mock.calls[0][1](event)

      expect(store.getState().addressBook).toEqual({})
    })

    it('should close the previous channel when called again', () => {
      const store = makeStore()
      const { addEventListener, close } = global.BroadcastChannel.prototype as unknown as Record<string, jest.Mock>

      listenToBroadcast(store)

      expect(close).toHaveBeenCalledTimes(1)
      expect(close.mock.contexts[0]).toBe(addEventListener.mock.contexts[0])
      expect(close.mock.contexts[0]).not.toBe(addEventListener.mock.contexts[1])
    })
  })
})
