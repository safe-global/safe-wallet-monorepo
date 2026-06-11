import { useCallback, useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppSelector } from '@/store'
import { isAuthenticated } from '@/store/authSlice'
import useGetSpaceAuditLog, { type SpaceAuditLogQueryArgs } from '../../hooks/useGetSpaceAuditLog'
import { useCurrentSpaceId } from '../../hooks/useCurrentSpaceId'
import type { SpaceAuditLogEntryDto, SpaceAuditLogPage } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import AuditEventRow from './AuditEventRow'
import ActivityLogFilters, { type ActivityLogFilterState, EMPTY_FILTERS } from './ActivityLogFilters'

export type SpaceActivityLogProps = {
  /** Server-side scoping to a subset of event types (e.g. the address book tab) */
  eventTypes?: SpaceAuditLogEntryDto['eventType'][]
  /** Show the actor/date/sort filter bar (Activity page on, address book tab off) */
  showFilters?: boolean
}

function getCursor(pageUrl: string | null | undefined): string | undefined {
  if (!pageUrl) return undefined
  try {
    return new URL(pageUrl).searchParams.get('cursor') ?? undefined
  } catch {
    return undefined
  }
}

// Invisible fetcher for pages after the first. Each mounted page keeps its
// RTK Query subscription, so tag invalidation refetches all pages.
function AuditLogPageFetcher({
  args,
  pageIndex,
  onPage,
}: {
  args: SpaceAuditLogQueryArgs
  pageIndex: number
  onPage: (pageIndex: number, page: SpaceAuditLogPage) => void
}) {
  const { currentData } = useGetSpaceAuditLog(args)

  useEffect(() => {
    if (currentData) {
      onPage(pageIndex, currentData)
    }
  }, [currentData, onPage, pageIndex])

  return null
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

function SpaceActivityLog({ eventTypes, showFilters = false }: SpaceActivityLogProps) {
  const spaceId = useCurrentSpaceId()
  const isUserSignedIn = useAppSelector(isAuthenticated)
  const [filters, setFilters] = useState<ActivityLogFilterState>(EMPTY_FILTERS)
  // Cursors of the pages loaded so far; index 0 is the first page.
  const [extraCursors, setExtraCursors] = useState<string[]>([])
  const [extraPages, setExtraPages] = useState<Record<number, SpaceAuditLogPage>>({})

  const queryArgs = useMemo(
    (): SpaceAuditLogQueryArgs => ({
      eventTypes,
      actorUserId: filters.actorUserId,
      createdAtGte: filters.createdAtGte,
      createdAtLte: filters.createdAtLte,
      sortDirection: filters.sortDirection,
    }),
    [eventTypes, filters],
  )

  // Reset pagination whenever the query scope changes.
  useEffect(() => {
    setExtraCursors([])
    setExtraPages({})
  }, [queryArgs, spaceId, isUserSignedIn])

  const { currentData: firstPage, isLoading, isError } = useGetSpaceAuditLog(queryArgs)

  const onPage = useCallback((pageIndex: number, page: SpaceAuditLogPage) => {
    setExtraPages((prev) => (prev[pageIndex] === page ? prev : { ...prev, [pageIndex]: page }))
  }, [])

  const lastPage = extraCursors.length > 0 ? extraPages[extraCursors.length - 1] : firstPage
  const nextCursor = getCursor(lastPage?.next)

  const onLoadMore = () => {
    if (nextCursor) {
      setExtraCursors((prev) => prev.concat(nextCursor))
    }
  }

  // Rows can shift between offset pages while paging — dedupe by id.
  const events = useMemo(() => {
    const pages = [firstPage, ...extraCursors.map((_, i) => extraPages[i])]
    const seen = new Set<string>()
    const rows: SpaceAuditLogEntryDto[] = []
    for (const page of pages) {
      for (const event of page?.results ?? []) {
        if (!seen.has(event.id)) {
          seen.add(event.id)
          rows.push(event)
        }
      }
    }
    return rows
  }, [firstPage, extraCursors, extraPages])

  const isFiltered = Boolean(filters.actorUserId || filters.createdAtGte || filters.createdAtLte)

  return (
    <div data-testid="space-activity-log">
      {showFilters && <ActivityLogFilters filters={filters} onFiltersChange={setFilters} />}

      {extraCursors.map((cursor, index) => (
        <AuditLogPageFetcher key={cursor} args={{ ...queryArgs, cursor }} pageIndex={index} onPage={onPage} />
      ))}

      <div className="bg-card rounded-lg border px-4">
        {isLoading ? (
          <LoadingSkeleton />
        ) : isError ? (
          <p className="text-muted-foreground py-4 text-sm">Could not load activity.</p>
        ) : events.length === 0 ? (
          <p className="text-muted-foreground py-4 text-sm">{isFiltered ? 'No results' : 'No activity yet.'}</p>
        ) : (
          <>
            <div className="divide-y">
              {events.map((event) => (
                <AuditEventRow key={event.id} event={event} />
              ))}
            </div>

            {nextCursor && (
              <div className="border-t py-3 text-center">
                <Button data-testid="activity-log-load-more" variant="outline" size="sm" onClick={onLoadMore}>
                  Load more
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default SpaceActivityLog
