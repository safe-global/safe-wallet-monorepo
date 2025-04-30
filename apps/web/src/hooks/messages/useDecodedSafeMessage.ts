import type { TypedData } from '@safe-global/store/gateway/AUTO_GENERATED/messages'
import { getDecodedMessage } from '@/components/safe-apps/utils'
import { generateSafeMessageMessage, generateSafeMessageHash } from '@safe-global/utils/utils/safe-messages'
import { type SafeState } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { useMemo } from 'react'

/**
 * Returns the decoded message, the hash of the `message` and the hash of the `safeMessage`.
 * The `safeMessageMessage` is the value inside the SafeMessage and the `safeMessageHash` gets signed if the connected wallet does not support `eth_signTypedData`.
 *
 * @param message message as string, UTF-8 encoded hex string or EIP-712 Typed Data
 * @param safe SafeInfo of the opened Safe
 * @returns `{
 *   decodedMessage,
 *   safeMessageMessage,
 *   safeMessageHash
 * }`
 */
const useDecodedSafeMessage = (
  message: string | TypedData,
  safe: SafeState,
): { decodedMessage: string | TypedData; safeMessageMessage: string; safeMessageHash: string } => {
  // Decode message if UTF-8 encoded
  const decodedMessage = useMemo(() => {
    return typeof message === 'string' ? getDecodedMessage(message) : message
  }, [message])

  // Get `SafeMessage` message
  const safeMessageMessage = useMemo(() => {
    return generateSafeMessageMessage(decodedMessage)
  }, [decodedMessage])

  // Get `SafeMessage` hash
  const safeMessageHash = useMemo(() => {
    return generateSafeMessageHash(safe, decodedMessage)
  }, [safe, decodedMessage])

  return {
    decodedMessage,
    safeMessageMessage,
    safeMessageHash,
  }
}

export default useDecodedSafeMessage
