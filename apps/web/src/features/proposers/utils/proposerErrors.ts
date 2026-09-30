import { isWalletRejection } from '@/utils/wallets'
import { shortenAddress } from '@safe-global/utils/utils/formatters'

/** The gateway rejects a second signature from the same owner with this 400 (WA-3526). */
const SIGNATURE_EXISTS_RE = /signature for owner (0x[0-9a-fA-F]{40}) already exists/i

export const SIGNATURE_REJECTED_ERROR = 'The signature request was rejected. Try again to continue.'

export const getProposerErrorText = (error: Error, fallback: string): string => {
  const owner = error.message.match(SIGNATURE_EXISTS_RE)?.[1]

  if (owner) {
    return `The owner ${shortenAddress(owner)} already confirmed this request. Sign with a different owner to continue.`
  }

  return isWalletRejection(error) ? SIGNATURE_REJECTED_ERROR : fallback
}
