import { useCallback } from 'react'
import { useLazySafesGetOverviewForManyQuery } from '@safe-global/store/gateway/safes'
import { normalizeOverviewArgs, type OverviewQueryArgs } from './overviewQueryArgs'

type LazyTrigger = ReturnType<typeof useLazySafesGetOverviewForManyQuery>[0]
type LazyResult = ReturnType<typeof useLazySafesGetOverviewForManyQuery>[1]
type LazyTriggerExtraArgs = Parameters<LazyTrigger> extends [unknown, ...infer Rest] ? Rest : []

export const useLazySafeOverviews = () => {
  const [trigger, result] = useLazySafesGetOverviewForManyQuery()

  // The returned trigger must keep a stable reference across renders: consumers
  // put it in `useCallback` deps / debounced closures, and an unstable ref
  // caused an infinite re-render + OOM regression during WA-2041 development.
  // See useLazySafeOverviews.test.ts for the ref-stability contract.
  const normalizedTrigger = useCallback(
    (args: OverviewQueryArgs, ...extra: LazyTriggerExtraArgs) => trigger(normalizeOverviewArgs(args), ...extra),
    [trigger],
  )

  return [normalizedTrigger, result] as [typeof normalizedTrigger, LazyResult]
}
