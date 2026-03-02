import { useSafesGetOverviewForManyQuery } from '@safe-global/store/gateway/safes'

type OverviewQueryArgs = {
  safes: string[]
  currency: string
  trusted?: boolean
  excludeSpam?: boolean
  walletAddress?: string
}

type OverviewQueryOptions = {
  skip?: boolean
  pollingInterval?: number
}

export function useSafeOverviewsQuery(args: OverviewQueryArgs, options?: OverviewQueryOptions) {
  const skip = options?.skip || args.safes.length === 0
  const normalizedArgs = { ...args, currency: args.currency.toUpperCase() }

  const result = useSafesGetOverviewForManyQuery(normalizedArgs, {
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
