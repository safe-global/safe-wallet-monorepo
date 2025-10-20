import { useEffect, useMemo, useState } from 'react'
import { getAddress, isAddress, JsonRpcProvider } from 'ethers'
import uniq from 'lodash/uniq'
import type { SafeTransaction } from '@safe-global/types-kit'
import { useSafeShieldAnalyzeCounterpartyV1Mutation } from '@safe-global/store/gateway/AUTO_GENERATED/safe-shield'
import { useAddressBookCheck } from './address-analysis/address-book-check/useAddressBookCheck'
import { useAddressActivity } from './address-analysis/address-activity/useAddressActivity'
import { type RecipientAnalysisResults, type ContractAnalysisResults } from '../types'
import type { AsyncResult } from '@safe-global/utils/hooks/useAsync'
import { useMemoDeepCompare } from './util-hooks/useMemoDeepCompare'
import { mergeAnalysisResults } from '../utils'

/**
 * Hook for fetching and analyzing counterparty addresses (both recipients and contracts)
 * Performs backend API calls and local checks (ADDRESS_BOOK, RECIPIENT_ACTIVITY) for recipients
 * Returns separate results for recipients and contracts
 *
 * @param safeAddress - The Safe contract address
 * @param chainId - The chain ID where the Safe is deployed
 * @param safeTx - SafeTransaction object containing transaction data
 * @param isInAddressBook - Function to check if address is in address book
 * @param ownedSafes - Array of Safe addresses owned by the user
 * @param web3ReadOnly - Read-only web3 provider for on-chain checks
 * @returns Object containing recipient and contract analysis results with loading and error states
 */
export function useCounterpartyAnalysis({
  safeAddress,
  chainId,
  safeTx,
  isInAddressBook,
  ownedSafes = [],
  web3ReadOnly,
}: {
  safeAddress: string
  chainId: string
  safeTx?: SafeTransaction
  isInAddressBook: (address: string, chainId: string) => boolean
  ownedSafes: string[]
  web3ReadOnly?: JsonRpcProvider
}): {
  recipient?: AsyncResult<RecipientAnalysisResults>
  contract?: AsyncResult<ContractAnalysisResults>
} {
  const [triggerAnalysis, { data: counterpartyData, error, isLoading }] = useSafeShieldAnalyzeCounterpartyV1Mutation()

  const [hasTriggered, setHasTriggered] = useState(false)

  // Extract transaction data from SafeTransaction
  const transactionData = useMemo(() => {
    if (!safeTx) return undefined
    return {
      to: getAddress(safeTx.data.to),
      value: safeTx.data.value,
      data: safeTx.data.data,
      operation: safeTx.data.operation as 0 | 1,
    }
  }, [safeTx])

  // Trigger the mutation when transaction data is available
  useEffect(() => {
    if (transactionData && !hasTriggered) {
      triggerAnalysis({
        chainId,
        safeAddress,
        counterpartyAnalysisRequestDto: transactionData,
      })
      setHasTriggered(true)
    }
  }, [transactionData, chainId, safeAddress, triggerAnalysis, hasTriggered])

  // Reset hasTriggered when transaction data changes
  const transactionDataMemo = useMemoDeepCompare(() => transactionData, [transactionData])
  useEffect(() => {
    setHasTriggered(false)
  }, [transactionDataMemo])

  // Extract recipient addresses from the counterparty analysis response
  const recipientAddresses = useMemo(() => {
    if (!counterpartyData?.recipient) {
      return []
    }
    const addresses = Object.keys(counterpartyData.recipient)
      .filter((address) => address && isAddress(address))
      .map(getAddress)
    return uniq(addresses)
  }, [counterpartyData])

  // Perform local checks on recipient addresses
  const addressBookCheck = useAddressBookCheck(chainId, recipientAddresses, isInAddressBook, ownedSafes)
  const [activityCheck, activityCheckError, activityCheckLoading] = useAddressActivity(recipientAddresses, web3ReadOnly)

  // Merge backend recipient results with local checks
  const mergedRecipientResults = useMemo(() => {
    // Only merge different results after all of them are available
    if (!counterpartyData?.recipient || !addressBookCheck || !activityCheck) {
      return undefined
    }

    return mergeAnalysisResults(
      counterpartyData?.recipient as RecipientAnalysisResults,
      addressBookCheck,
      activityCheck,
    )
  }, [counterpartyData?.recipient, addressBookCheck, activityCheck])

  const fetchError = useMemo(() => {
    if (error) {
      return new Error('error' in error ? error.error : 'Failed to fetch counterparty analysis')
    }
    return undefined
  }, [error])

  // Return results in the expected format
  return {
    recipient:
      recipientAddresses.length > 0
        ? [mergedRecipientResults, fetchError || activityCheckError, isLoading || activityCheckLoading]
        : undefined,
    contract: counterpartyData?.contract
      ? [counterpartyData.contract as ContractAnalysisResults, fetchError, isLoading]
      : undefined,
  }
}
