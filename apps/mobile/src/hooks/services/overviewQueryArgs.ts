/**
 * Shared shape + normalization for Safe-overviews RTK Query args.
 *
 * Used by both `useSafeOverviewsQuery` (eager) and `useLazySafeOverviews`
 * (lazy) so their cache keys stay identical — the owners-list container
 * and the ownership-validation hook rely on hitting the same entry.
 */
export type OverviewQueryArgs = {
  safes: string[]
  currency: string
  trusted?: boolean
  excludeSpam?: boolean
  walletAddress?: string
}

export const normalizeOverviewArgs = (args: OverviewQueryArgs): OverviewQueryArgs => ({
  ...args,
  currency: args.currency.toLowerCase(),
})
