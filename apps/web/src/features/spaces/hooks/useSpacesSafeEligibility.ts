import { useMemo } from 'react'
import { skipToken } from '@reduxjs/toolkit/query'
import { useEntitlementsGetAllEntitlementsV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/entitlements'
import { useSpaceSafesGetAllV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useIsSafeProEnabled } from '@/hooks/useIsSafeProEnabled'
import type { SafeLimit } from '@/utils/spaces'
import { SAFE_ACCOUNTS_LIMIT } from '../constants'
import { getSeatsMeter } from './billing/entitlements'
import { useRateLimitRetry } from './billing/useRateLimitRetry'
import { SPACE_REFRESH_OPTIONS } from './refreshOptions'

/** Safe addresses by chain ID. */
type SpaceSafes = Record<string, string[]>

type SpacesSafeEligibility = {
  /** Undefined while loading, or when the Safes request failed. */
  getSafes: (spaceId: string) => SpaceSafes | undefined
  /** Under Safe Pro, undefined until the seats meter of the Workspace arrives. */
  getLimit: (spaceId: string) => SafeLimit
  /** Undefined while the entitlements of the Workspace are unknown; always true without Safe Pro. */
  hasPlan: (spaceId: string) => boolean | undefined
  isLoading: boolean
}

type QueryState = { currentData?: unknown; isLoading: boolean; isFetching: boolean }

// `currentData` is empty while a refetch with new args runs; that gap reads as loading, not as no data.
const isQueryLoading = ({ currentData, isLoading, isFetching }: QueryState): boolean =>
  isLoading || (isFetching && currentData === undefined)

/** The Safes and Safe limits of all Workspaces of the user, from one request each instead of two per Workspace. */
export const useSpacesSafeEligibility = (enabled: boolean): SpacesSafeEligibility => {
  const isSafePro = useIsSafeProEnabled()
  const safesQuery = useSpaceSafesGetAllV1Query(enabled ? undefined : skipToken, SPACE_REFRESH_OPTIONS)
  const entitlementsQuery = useEntitlementsGetAllEntitlementsV1Query(
    enabled && isSafePro ? undefined : skipToken,
    SPACE_REFRESH_OPTIONS,
  )
  const isRetryingSafes = useRateLimitRetry({ error: safesQuery.error, refetch: safesQuery.refetch })
  const isRetryingEntitlements = useRateLimitRetry({
    error: entitlementsQuery.error,
    refetch: entitlementsQuery.refetch,
  })

  const safesBySpace = useMemo(
    () => new Map(safesQuery.currentData?.map(({ spaceUuid, safes }) => [spaceUuid, safes])),
    [safesQuery.currentData],
  )

  const getLimit = (spaceId: string): SafeLimit => {
    if (!isSafePro) return SAFE_ACCOUNTS_LIMIT
    const seats = getSeatsMeter(entitlementsQuery.currentData?.[spaceId])
    return seats ? seats.quota : undefined
  }

  const hasPlan = (spaceId: string): boolean | undefined => {
    if (!isSafePro) return true
    const entitlements = entitlementsQuery.currentData?.[spaceId]
    return entitlements ? entitlements.plan !== null : undefined
  }

  return {
    getSafes: (spaceId) => safesBySpace.get(spaceId),
    getLimit,
    hasPlan,
    isLoading:
      isQueryLoading(safesQuery) || isQueryLoading(entitlementsQuery) || isRetryingSafes || isRetryingEntitlements,
  }
}
