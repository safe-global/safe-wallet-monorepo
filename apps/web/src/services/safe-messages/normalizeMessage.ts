import type { TypedData } from '@safe-global/store/gateway/AUTO_GENERATED/messages'
import { normalizeTypedData } from '@safe-global/utils/utils/web3'
import { Errors, logError } from '@/services/exceptions'

/** Falls back to the raw message when it cannot be normalized, so it still renders. */
export const normalizeMessageForDisplay = (message: TypedData): TypedData => {
  try {
    return normalizeTypedData(message)
  } catch (e) {
    logError(Errors._809, e)
    return message
  }
}
