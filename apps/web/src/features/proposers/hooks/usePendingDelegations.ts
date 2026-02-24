import { useMemo } from 'react'
import { useMessagesGetMessagesBySafeV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/messages'
import type { MessageItem } from '@safe-global/store/gateway/AUTO_GENERATED/messages'
import useChainId from '@/hooks/useChainId'
import useSafeAddress from '@/hooks/useSafeAddress'
import { useNestedSafeOwners } from '@/hooks/useNestedSafeOwners'
import useProposers from '@/hooks/useProposers'
import { parseMessageToDelegation, type DelegationWithTimestamp } from '@/features/proposers/utils/delegationParsing'
import { keepLatestPerDelegate, filterActedUponDelegations } from '@/features/proposers/utils/delegationFilters'
import type { PendingDelegation } from '@/features/proposers/types'
import { DELEGATION_POLLING_INTERVAL_MS } from '@/features/proposers/constants'

type UsePendingDelegationsResult = {
  pendingDelegations: PendingDelegation[]
  isLoading: boolean
  refetch: () => void
}

/**
 * Fetches pending delegation messages from the parent Safe and filters for the current nested Safe.
 * Returns parsed PendingDelegation objects with derived status.
 * Uses RTK Query's built-in polling with a fixed 5 second interval.
 */
export function usePendingDelegations(): UsePendingDelegationsResult {
  const chainId = useChainId()
  const safeAddress = useSafeAddress()
  const nestedSafeOwners = useNestedSafeOwners()
  const parentSafeAddress = nestedSafeOwners?.[0]
  const proposers = useProposers()

  const {
    data: messagesPage,
    isLoading,
    refetch,
  } = useMessagesGetMessagesBySafeV1Query(
    {
      chainId,
      safeAddress: parentSafeAddress || '',
    },
    {
      skip: !parentSafeAddress,
      pollingInterval: DELEGATION_POLLING_INTERVAL_MS,
    },
  )

  // Map of lowercase address -> label for current delegates
  const currentDelegatesMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const p of proposers.data?.results ?? []) {
      map.set(p.delegate.toLowerCase(), p.label)
    }
    return map
  }, [proposers.data?.results])

  const pendingDelegations = useMemo(() => {
    if (!messagesPage?.results || !parentSafeAddress) return []

    const allDelegations = messagesPage.results
      .filter((item): item is MessageItem => item.type === 'MESSAGE')
      .map((message) => parseMessageToDelegation(message, safeAddress, parentSafeAddress))
      .filter((d): d is DelegationWithTimestamp => d !== null)

    const latestByDelegate = keepLatestPerDelegate(allDelegations)
    return filterActedUponDelegations(latestByDelegate, currentDelegatesMap)
  }, [messagesPage, parentSafeAddress, safeAddress, currentDelegatesMap])

  return { pendingDelegations, isLoading, refetch }
}
