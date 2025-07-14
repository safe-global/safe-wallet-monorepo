import { useMemo } from 'react'
import { useAppSelector } from '@/store'
import { selectAllAddedSafes } from '@/store/addedSafesSlice'
import { selectTxHistory } from '@/store/txHistorySlice'
import { useCurrentChain } from '@/hooks/useChains'
import { fromUnixTime } from 'date-fns'
import type { SafeUserAttributes } from './types'
import type { ExtendedSafeInfo } from '@safe-global/store/slices/SafeInfo/types'
import type { TransactionListPage } from '@safe-global/safe-gateway-typescript-sdk'

/**
 * Gets the most recent transaction timestamp
 * @param transactions Transaction history
 * @returns Date of most recent transaction or null
 */
const getLastTxTimestamp = (transactions: TransactionListPage | undefined): Date | null => {
  if (!transactions?.results?.length) return null

  try {
    const mostRecentTx = transactions.results[0]

    // Handle different transaction object structures
    let timestamp: number | null = null

    if (mostRecentTx?.type === 'TRANSACTION' && mostRecentTx?.transaction) {
      // Standard transaction structure - timestamp is in milliseconds
      timestamp = mostRecentTx.transaction.timestamp
    } else if (mostRecentTx?.type === 'DATE_LABEL' && mostRecentTx?.timestamp) {
      // Date label timestamp
      timestamp = mostRecentTx.timestamp
    }

    return timestamp ? new Date(timestamp) : null
  } catch (error) {
    console.warn('Error parsing transaction timestamp:', error)
    return null
  }
}

/**
 * Gets all networks (chains) that the user has Safes on
 * @param addedSafes All added Safes across chains
 * @param currentChainName Current chain name as fallback
 * @returns Array of network names
 */
const getUserNetworks = (addedSafes: Record<string, any>, currentChainName: string): string[] => {
  try {
    if (!addedSafes || typeof addedSafes !== 'object') return [currentChainName.toLowerCase()]

    const chainIds = Object.keys(addedSafes)
    if (chainIds.length === 0) return [currentChainName.toLowerCase()]

    // For now, return the current chain name as the primary network
    // TODO: Implement proper chain name mapping when needed
    return [currentChainName.toLowerCase()]
  } catch (error) {
    console.warn('Error getting user networks:', error)
    return [currentChainName.toLowerCase()]
  }
}

/**
 * Gets nested Safe IDs from the Safe configuration
 * @returns Array of nested Safe addresses
 */
const getNestedSafeIds = (): string[] => {
  // Check if any owners are actually Safe contracts
  // In a real implementation, we'd need to check if an owner address is a Safe contract
  // For now, we'll return an empty array as this requires additional API calls
  // TODO: Implement nested Safe detection
  return []
}

/**
 * Custom hook to compute Safe user attributes for MixPanel tracking
 * @param safeInfo Current Safe information
 * @param walletAddress Connected wallet address
 * @returns SafeUserAttributes object
 */
export const useSafeUserAttributes = (
  safeInfo: ExtendedSafeInfo | null,
  walletAddress: string | undefined,
): SafeUserAttributes | null => {
  const currentChain = useCurrentChain()
  const addedSafes = useAppSelector(selectAllAddedSafes)
  const txHistory = useAppSelector(selectTxHistory)

  return useMemo(() => {
    try {
      if (!safeInfo || !walletAddress || !currentChain) return null

      const safeAddress = safeInfo.address?.value
      if (!safeAddress) return null

      const networks = getUserNetworks(addedSafes, currentChain.chainName)
      const lastTxTimestamp = getLastTxTimestamp(txHistory?.data)
      const nestedSafeIds = getNestedSafeIds()

      // Parse creation date with fallback
      let createdAt: Date
      try {
        if (safeInfo.implementation?.value) {
          // Try to parse as unix timestamp (seconds)
          const timestamp = parseInt(safeInfo.implementation.value, 10)
          if (!isNaN(timestamp) && timestamp > 0) {
            createdAt = fromUnixTime(timestamp)
          } else {
            createdAt = new Date()
          }
        } else {
          createdAt = new Date()
        }
      } catch (error) {
        createdAt = new Date()
      }

      const userAttributes: SafeUserAttributes = {
        safe_id: safeAddress,
        created_at: createdAt,
        safe_version: safeInfo.version || 'null',
        num_signers: safeInfo.owners.length,
        threshold: safeInfo.threshold,
        networks,
        last_tx_at: lastTxTimestamp,
        space_id: null, // TODO: Implement Space detection when available
        nested_safe_ids: nestedSafeIds,
        total_tx_count: Number(safeInfo.txQueuedTag) || 0,
      }

      return userAttributes
    } catch (error) {
      console.warn('Error creating user attributes:', error)
      return null
    }
  }, [safeInfo, walletAddress, currentChain, addedSafes, txHistory])
}

/**
 * Helper function to prepare user attributes for MixPanel
 * Converts Date objects to ISO strings and uses humanized attribute names
 * @param attributes SafeUserAttributes object
 * @returns Object with MixPanel-compatible values and humanized names
 */
export const prepareMixPanelUserAttributes = (attributes: SafeUserAttributes) => {
  return {
    'Safe Address': attributes.safe_id,
    'Created at': attributes.created_at?.toISOString() || null,
    'Safe Version': attributes.safe_version,
    'Number of Signers': attributes.num_signers,
    Threshold: attributes.threshold,
    Networks: attributes.networks,
    'Last Transaction at': attributes.last_tx_at?.toISOString() || null,
    'Space ID': attributes.space_id,
    'Nested Safe IDs': attributes.nested_safe_ids,
    'Total Transaction Count': attributes.total_tx_count,
  }
}

/**
 * Helper function to get basic Safe event properties
 * @param safeInfo Safe information
 * @param chainName Current chain name
 * @returns Basic event properties for MixPanel events with humanized names
 */
export const getSafeEventProperties = (safeInfo: ExtendedSafeInfo | null, chainName: string) => {
  if (!safeInfo) return null

  return {
    'Safe Address': safeInfo.address.value,
    'Safe Version': safeInfo.version,
    Network: chainName.toLowerCase(),
  }
}
