import { MMKV } from 'react-native-mmkv'

let processedMessagesStorage: MMKV | null = null

const getProcessedMessagesStorage = (): MMKV => {
  if (!processedMessagesStorage) {
    processedMessagesStorage = new MMKV({ id: 'processed-messages' })
  }
  return processedMessagesStorage
}

/**
 * Check if a Firebase message has already been processed and mark it as processed
 * @param messageId - The Firebase message ID or fallback identifier
 * @param maxStoredMessages - Maximum number of processed messages to keep (default: 50)
 * @returns true if message was already processed (should skip), false if new (should process)
 */
export const checkAndMarkMessageProcessed = (messageId: string, maxStoredMessages = 50): boolean => {
  const storage = getProcessedMessagesStorage()
  const processedKey = `processed_${messageId}`

  // Check if message was already processed
  if (storage.getBoolean(processedKey)) {
    console.log('[MessageDeduplication] Message already processed, skipping:', messageId)
    return true // Already processed - should skip
  }

  // Mark message as processed IMMEDIATELY to prevent redelivery
  storage.set(processedKey, true)
  console.log('[MessageDeduplication] Message marked as processed:', messageId)

  // Cleanup old processed messages to avoid memory bloat
  const allKeys = storage.getAllKeys().filter((key) => key.startsWith('processed_'))
  if (allKeys.length > maxStoredMessages) {
    const oldKeys = allKeys.slice(0, allKeys.length - maxStoredMessages)
    oldKeys.forEach((key) => storage.delete(key))
    console.log('[MessageDeduplication] Cleaned up', oldKeys.length, 'old processed messages')
  }

  return false // New message - should process
}

/**
 * Clear all processed message records (useful for testing or reset)
 */
export const clearProcessedMessages = (): void => {
  const storage = getProcessedMessagesStorage()
  const allKeys = storage.getAllKeys().filter((key) => key.startsWith('processed_'))
  allKeys.forEach((key) => storage.delete(key))
  console.log('[MessageDeduplication] Cleared all processed messages:', allKeys.length, 'records')
}
