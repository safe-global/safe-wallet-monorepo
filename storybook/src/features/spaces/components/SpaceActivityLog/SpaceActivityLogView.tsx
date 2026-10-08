import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { SpaceAuditLogEntryDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'

export type SpaceActivityLogViewProps = {
  filters: ReactNode
  pageFetchers: ReactNode
  events: SpaceAuditLogEntryDto[]
  renderEvent: (event: SpaceAuditLogEntryDto) => ReactNode
  isLoading: boolean
  isError: boolean
  isFiltered: boolean
  hasMore: boolean
  isLoadingMore: boolean
  onLoadMore: () => void
}

function LoadingSkeleton() {
  return (
    <div data-testid="activity-log-loading" className="flex flex-col gap-4 py-3">
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="size-8 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function SpaceActivityLogView({
  filters,
  pageFetchers,
  events,
  renderEvent,
  isLoading,
  isError,
  isFiltered,
  hasMore,
  isLoadingMore,
  onLoadMore,
}: SpaceActivityLogViewProps) {
  return (
    <div data-testid="space-activity-log">
      {filters}

      {pageFetchers}

      <div className="bg-card rounded-lg px-4">
        {isLoading ? (
          <LoadingSkeleton />
        ) : isError ? (
          <p className="text-muted-foreground py-4 text-sm">Could not load activity.</p>
        ) : events.length === 0 ? (
          <p className="text-muted-foreground py-4 text-sm">{isFiltered ? 'No results' : 'No activity yet.'}</p>
        ) : (
          <>
            <div>{events.map((event) => renderEvent(event))}</div>

            {(hasMore || isLoadingMore) && (
              <div className="py-3 text-center">
                <Button
                  data-testid="activity-log-load-more"
                  variant="outline"
                  size="sm"
                  disabled={isLoadingMore}
                  onClick={onLoadMore}
                >
                  {isLoadingMore ? 'Loading…' : 'Load more'}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
