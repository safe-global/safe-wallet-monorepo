import { useSafesGetOverviewForManyQuery } from '@safe-global/store/gateway/safes'
import { normalizeOverviewArgs, type OverviewQueryArgs } from './overviewQueryArgs'

type OverviewQueryOptions = {
  skip?: boolean
  pollingInterval?: number
}

export function useSafeOverviewsQuery(args: OverviewQueryArgs, options?: OverviewQueryOptions) {
  const skip = options?.skip || args.safes.length === 0

  const result = useSafesGetOverviewForManyQuery(normalizeOverviewArgs(args), {
    skip,
    pollingInterval: options?.pollingInterval,
  })

  return {
    data: skip ? undefined : result.data,
    currentData: skip ? undefined : result.currentData,
    isLoading: result.isLoading,
    isFetching: result.isFetching,
    error: result.error,
  }
}
