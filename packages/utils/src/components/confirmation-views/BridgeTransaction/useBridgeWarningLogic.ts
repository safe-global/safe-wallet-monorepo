import { useMemo } from 'react'
import { BridgeWarnings, type BridgeWarning } from './BridgeWarnings'

export interface BridgeWarningData {
  // Address comparison
  isSameAddress: boolean

  // Chain and safe validation
  isDestinationChainSupported: boolean
  isMultiChainSafe: boolean

  // Destination safe information
  otherSafeExists: boolean
  hasSameSetup: boolean

  // Recipient validation
  isRecipientInAddressBook: boolean
  isRecipientOwnedSafe: boolean
}

/**
 * Shared hook that contains all the bridge warning logic.
 * Takes platform-specific data and returns the appropriate warning to display.
 *
 * @param data - The bridge warning data gathered from platform-specific sources
 * @returns The warning to display, or null if no warning is needed
 */
export const useBridgeWarningLogic = (data: BridgeWarningData): BridgeWarning | null => {
  return useMemo(() => {
    const {
      isSameAddress,
      isDestinationChainSupported,
      isMultiChainSafe,
      otherSafeExists,
      hasSameSetup,
      isRecipientInAddressBook,
      isRecipientOwnedSafe,
    } = data

    // When bridging to the same address (own safe)
    if (isSameAddress) {
      // Check if destination chain is supported
      if (!isDestinationChainSupported) {
        return BridgeWarnings.UNKNOWN_CHAIN
      }

      // If safe exists on destination chain
      if (otherSafeExists) {
        // Check if setup matches
        if (hasSameSetup) {
          return null // All good, no warning needed
        }
        return BridgeWarnings.DIFFERENT_SETUP
      }

      // Safe doesn't exist on destination chain
      if (!isMultiChainSafe) {
        return BridgeWarnings.NO_MULTICHAIN_SUPPORT
      }

      return BridgeWarnings.SAFE_NOT_DEPLOYED
    }

    // When bridging to a different address
    if (!isRecipientInAddressBook && !isRecipientOwnedSafe) {
      return BridgeWarnings.DIFFERENT_ADDRESS
    }

    return null // No warning needed
  }, [data])
}
