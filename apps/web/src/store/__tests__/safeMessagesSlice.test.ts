import { safeMessagesListener } from '../safeMessagesSlice'
import { createListenerMiddleware } from '@reduxjs/toolkit'
import type { RootState } from '..'

describe('safeMessagesSlice', () => {
  describe('safeMessagesListener', () => {
    const listenerMiddlewareInstance = createListenerMiddleware<RootState>()

    it('should register listener without errors', () => {
      expect(() => safeMessagesListener(listenerMiddlewareInstance)).not.toThrow()
    })
  })
})
