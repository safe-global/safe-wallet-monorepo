import { faker } from '@faker-js/faker'
import { checkAndMarkMessageProcessed, clearProcessedMessages } from './messageDeduplication'

describe('messageDeduplication', () => {
  beforeEach(() => {
    clearProcessedMessages()
  })

  describe('checkAndMarkMessageProcessed', () => {
    it('returns false for a new message', () => {
      const messageId = faker.string.uuid()

      const result = checkAndMarkMessageProcessed(messageId)

      expect(result).toBe(false)
    })

    it('returns true for an already processed message', () => {
      const messageId = faker.string.uuid()

      checkAndMarkMessageProcessed(messageId)
      const result = checkAndMarkMessageProcessed(messageId)

      expect(result).toBe(true)
    })

    it('handles multiple different messages independently', () => {
      const messageId1 = faker.string.uuid()
      const messageId2 = faker.string.uuid()

      const result1 = checkAndMarkMessageProcessed(messageId1)
      const result2 = checkAndMarkMessageProcessed(messageId2)

      expect(result1).toBe(false)
      expect(result2).toBe(false)
    })

    it('cleans up old messages when exceeding maxStoredMessages', () => {
      const maxStoredMessages = 5

      for (let i = 0; i < maxStoredMessages + 3; i++) {
        checkAndMarkMessageProcessed(`message-${i}`, maxStoredMessages)
      }

      // Old messages should be cleaned up, so checking them again should return false
      const oldMessageResult = checkAndMarkMessageProcessed('message-0', maxStoredMessages)
      expect(oldMessageResult).toBe(false)

      // Recent messages should still be tracked
      const recentMessageResult = checkAndMarkMessageProcessed(`message-${maxStoredMessages + 2}`, maxStoredMessages)
      expect(recentMessageResult).toBe(true)
    })

    it('preserves most recent messages during cleanup', () => {
      const maxStoredMessages = 3

      checkAndMarkMessageProcessed('message-1', maxStoredMessages)
      checkAndMarkMessageProcessed('message-2', maxStoredMessages)
      checkAndMarkMessageProcessed('message-3', maxStoredMessages)
      checkAndMarkMessageProcessed('message-4', maxStoredMessages)
      checkAndMarkMessageProcessed('message-5', maxStoredMessages)

      // Most recent should still be tracked
      expect(checkAndMarkMessageProcessed('message-5', maxStoredMessages)).toBe(true)
    })
  })

  describe('clearProcessedMessages', () => {
    it('clears all processed messages from storage', () => {
      checkAndMarkMessageProcessed('message-1')
      checkAndMarkMessageProcessed('message-2')
      checkAndMarkMessageProcessed('message-3')

      // Verify they're tracked
      expect(checkAndMarkMessageProcessed('message-1')).toBe(true)

      clearProcessedMessages()

      // After clearing, messages should be treated as new
      expect(checkAndMarkMessageProcessed('message-1')).toBe(false)
      expect(checkAndMarkMessageProcessed('message-2')).toBe(false)
      expect(checkAndMarkMessageProcessed('message-3')).toBe(false)
    })

    it('handles empty storage gracefully', () => {
      expect(() => clearProcessedMessages()).not.toThrow()
    })
  })

  describe('edge cases', () => {
    it('handles empty message ID', () => {
      const result = checkAndMarkMessageProcessed('')

      expect(result).toBe(false)
      // Calling again with empty should return true (it was tracked)
      expect(checkAndMarkMessageProcessed('')).toBe(true)
    })

    it('handles special characters in message ID', () => {
      const specialId = 'msg-!@#$%^&*()_+-=[]{}|;:,.<>?'

      const result = checkAndMarkMessageProcessed(specialId)

      expect(result).toBe(false)
      expect(checkAndMarkMessageProcessed(specialId)).toBe(true)
    })

    it('handles very long message IDs', () => {
      const longId = 'a'.repeat(1000)

      const result = checkAndMarkMessageProcessed(longId)

      expect(result).toBe(false)
      expect(checkAndMarkMessageProcessed(longId)).toBe(true)
    })
  })
})
