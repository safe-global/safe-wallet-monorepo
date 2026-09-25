import { useCallback, useMemo } from 'react'
import {
  useSpaceSafesDeleteV1Mutation,
  useSpaceSafesGetV1Query,
} from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { getRtkQueryErrorMessage } from '@/utils/rtkQuery'
import { countSeats } from '@/utils/spaces'
import type { SafeRef } from '../../components/Plans/types'

export const useSeatTrim = (spaceId: string) => {
  const { currentData: spaceSafes } = useSpaceSafesGetV1Query({ spaceId })
  const [removeSafes, { isLoading: isTrimming, error: removeError }] = useSpaceSafesDeleteV1Mutation()

  const seatCount = useMemo(() => countSeats(Object.values(spaceSafes?.safes ?? {}).flat()), [spaceSafes])

  const needsTrim = useCallback(
    (seats: number | null | undefined): seats is number => seats != null && seatCount > seats,
    [seatCount],
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

  return { seatCount, needsTrim, trim, isTrimming, error }
}
