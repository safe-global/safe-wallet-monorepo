import { useCallback } from 'react'
import { useLazySafesGetOverviewForManyQuery } from '@safe-global/store/gateway/safes'

type OverviewQueryArgs = {
  safes: string[]
  currency: string
  trusted?: boolean
  excludeSpam?: boolean
  walletAddress?: string
}

export const useLazySafeOverviews = () => {
  const [trigger, result] = useLazySafesGetOverviewForManyQuery()

  const normalizedTrigger = useCallback(
    (args: OverviewQueryArgs, preferCacheValue?: boolean) =>
      trigger({ ...args, currency: args.currency.toUpperCase() }, preferCacheValue),
    [trigger],
  )

  return [normalizedTrigger, result] as const
}
