import type { ReactElement } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

const CHIP_COUNT = 4
const ROW_COUNT = 6
const HAIRLINE = '1px solid var(--color-border-light)'

/**
 * Loading placeholder for the score card. Mirrors the real compact layout
 * (eyebrow → number → verdict → bar → filter chips → re-scan + caption) so the
 * page doesn't reflow when data arrives. Shared by the initial-load state
 * (SecurityHub) and the mid-scan state (WorkspaceHealthCard).
 */
export const HealthSummarySkeleton = (): ReactElement => (
  <div className="mb-6" data-testid="security-health-skeleton">
    <Card>
      <CardContent>
        <div className="flex items-center gap-6">
          <Skeleton className="size-[116px] shrink-0 rounded-full" />
          <div className="flex flex-1 flex-col gap-3">
            <Skeleton className="h-5 w-20" />
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: CHIP_COUNT }).map((_, i) => (
                <Skeleton key={i} className="h-7 w-24 rounded-full" />
              ))}
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-24 rounded-md" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
)

/** Loading placeholder for the Safes table — header row + account rows. */
export const SafesTableSkeleton = (): ReactElement => (
  <Card className="border-border overflow-hidden border bg-card" data-testid="security-table-skeleton">
    <div className="flex items-center px-6 py-3" style={{ borderBottom: HAIRLINE }}>
      <Skeleton className="h-3 w-20" />
      <Skeleton className="ml-auto h-3 w-12" />
      <Skeleton className="ml-10 h-3 w-12" />
    </div>
    {Array.from({ length: ROW_COUNT }).map((_, i) => (
      <div
        key={i}
        className="flex items-center gap-3 px-6"
        style={{ height: 60, borderBottom: i < ROW_COUNT - 1 ? HAIRLINE : undefined }}
      >
        <Skeleton className="size-10 shrink-0 rounded-full" />
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-3.5 w-28" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="ml-auto h-4 w-20 rounded-full" />
        <Skeleton className="ml-8 h-3.5 w-16" />
      </div>
    ))}
  </Card>
)

/** Full-page loading skeleton: health summary + table. */
const SecurityHubSkeleton = (): ReactElement => (
  <>
    <HealthSummarySkeleton />
    <SafesTableSkeleton />
  </>
)

export default SecurityHubSkeleton
