import {
  pendingSafeMessagesSlice,
  setPendingSafeMessage,
  clearPendingSafeMessage,
  selectPendingSafeMessages,
  selectPendingSafeMessageByHash,
} from '../pendingSafeMessagesSlice'
import type { RootState } from '@/store'

describe('pendingSafeMessagesSlice', () => {
  const { reducer } = pendingSafeMessagesSlice

  describe('setPendingSafeMessage', () => {
    it('should mark a message hash as pending', () => {
      const state = reducer({}, setPendingSafeMessage('0xhash1'))

      expect(state['0xhash1']).toBe(true)
    })

    it('should support multiple pending messages', () => {
      let state = reducer({}, setPendingSafeMessage('0xhash1'))
      state = reducer(state, setPendingSafeMessage('0xhash2'))

      expect(state['0xhash1']).toBe(true)
      expect(state['0xhash2']).toBe(true)
    })
  })

  describe('clearPendingSafeMessage', () => {
    it('should remove a pending message', () => {
      let state = reducer({}, setPendingSafeMessage('0xhash1'))
      state = reducer(state, clearPendingSafeMessage('0xhash1'))

      expect(state['0xhash1']).toBeUndefined()
    })

    it('should not affect other pending messages', () => {
      let state = reducer({}, setPendingSafeMessage('0xhash1'))
      state = reducer(state, setPendingSafeMessage('0xhash2'))
      state = reducer(state, clearPendingSafeMessage('0xhash1'))

      expect(state['0xhash1']).toBeUndefined()
      expect(state['0xhash2']).toBe(true)
    })
  })

  describe('selectPendingSafeMessages', () => {
    it('returns the pending messages state', () => {
      const pendingState = { '0xhash1': true as const }
      const rootState = { pendingSafeMessages: pendingState } as unknown as RootState

      expect(selectPendingSafeMessages(rootState)).toEqual(pendingState)
    })
  })

  describe('selectPendingSafeMessageByHash', () => {
    it('returns true for a pending message', () => {
      const rootState = { pendingSafeMessages: { '0xhash1': true as const } } as unknown as RootState

      expect(selectPendingSafeMessageByHash(rootState, '0xhash1')).toBe(true)
    })

    it('returns false for a non-pending message', () => {
      const rootState = { pendingSafeMessages: {} } as unknown as RootState

      expect(selectPendingSafeMessageByHash(rootState, '0xhash1')).toBe(false)
    })
  })
})
