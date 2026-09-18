import { useCallback, useMemo } from 'react'
import {
  useSpaceSafesDeleteV1Mutation,
  useSpaceSafesGetV1Query,
} from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { getRtkQueryErrorMessage } from '@/utils/rtkQuery'
import type { SafeRef } from '../../components/Plans/types'

/**
 * Fits the Workspace to a seat-limited plan: `needsTrim` tells whether the accounts step is shown (the Workspace holds
 * more Safes than the plan covers) and `trim` removes the Safes left out, which stay in My accounts.
 */
export const useSeatTrim = (spaceId: string) => {
  const { currentData: spaceSafes } = useSpaceSafesGetV1Query({ spaceId })
  const [removeSafes, { isLoading: isTrimming, error: removeError }] = useSpaceSafesDeleteV1Mutation()

  const safeCount = useMemo(
    () => Object.values(spaceSafes?.safes ?? {}).reduce((total, addresses) => total + addresses.length, 0),
    [spaceSafes],
  )

  const needsTrim = useCallback(
    (seats: number | null | undefined): seats is number => seats != null && safeCount > seats,
    [safeCount],
  )

  const trim = useCallback(
    async (removed: SafeRef[]): Promise<boolean> => {
      if (removed.length === 0) return true
      const result = await removeSafes({ spaceId, deleteSpaceSafesDto: { safes: removed } })
      return !result.error
    },
    [removeSafes, spaceId],
  )

  const error = removeError
    ? getRtkQueryErrorMessage(removeError) || 'We couldn’t update the Workspace. Please try again.'
    : undefined

  return { safeCount, needsTrim, trim, isTrimming, error }
}
