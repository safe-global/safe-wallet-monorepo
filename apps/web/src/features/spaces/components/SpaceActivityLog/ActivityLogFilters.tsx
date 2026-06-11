import { endOfDay, isValid, startOfDay } from 'date-fns'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import useGetSpaceAuditLogActors from '../../hooks/useGetSpaceAuditLogActors'

export type ActivityLogFilterState = {
  actorUserId?: number
  createdAtGte?: string
  createdAtLte?: string
  sortDirection?: 'asc' | 'desc'
}

export const EMPTY_FILTERS: ActivityLogFilterState = {}

const ALL_ACTORS = 'all'
const ALL_ACTORS_LABEL = 'All members'

const SORT_LABELS: Record<'asc' | 'desc', string> = {
  desc: 'Newest first',
  asc: 'Oldest first',
}

function toIsoBound(dateValue: string, isUpperBound: boolean): string | undefined {
  if (!dateValue) return undefined
  const date = new Date(`${dateValue}T00:00:00`)
  if (!isValid(date)) return undefined
  return (isUpperBound ? endOfDay(date) : startOfDay(date)).toISOString()
}

function ActivityLogFilters({
  filters,
  onFiltersChange,
}: {
  filters: ActivityLogFilterState
  onFiltersChange: (filters: ActivityLogFilterState) => void
}) {
  // Includes former and deleted members — their events stay filterable.
  const actors = useGetSpaceAuditLogActors()

  const selectedActor = actors.find((actor) => actor.actorUserId === filters.actorUserId)
  const sortDirection = filters.sortDirection ?? 'desc'

  return (
    <div data-testid="activity-log-filters" className="mb-4 flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="activity-actor-filter" className="text-muted-foreground text-xs">
          Member
        </Label>
        <Select
          value={filters.actorUserId !== undefined ? String(filters.actorUserId) : ALL_ACTORS}
          onValueChange={(value) =>
            onFiltersChange({ ...filters, actorUserId: value === ALL_ACTORS ? undefined : Number(value) })
          }
        >
          <SelectTrigger id="activity-actor-filter" className="bg-card w-48 cursor-pointer rounded-lg">
            <SelectValue placeholder={ALL_ACTORS_LABEL}>
              <span className="truncate">{selectedActor ? selectedActor.actor : ALL_ACTORS_LABEL}</span>
            </SelectValue>
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false} align="start">
            <SelectItem value={ALL_ACTORS}>{ALL_ACTORS_LABEL}</SelectItem>
            {actors.map((actor) => (
              <SelectItem key={actor.actorUserId} value={String(actor.actorUserId)}>
                {actor.actor}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="activity-from-filter" className="text-muted-foreground text-xs">
          From
        </Label>
        <Input
          id="activity-from-filter"
          type="date"
          className="bg-card border-input w-40 rounded-lg [color-scheme:light] dark:[color-scheme:dark]"
          onChange={(event) => onFiltersChange({ ...filters, createdAtGte: toIsoBound(event.target.value, false) })}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="activity-to-filter" className="text-muted-foreground text-xs">
          To
        </Label>
        <Input
          id="activity-to-filter"
          type="date"
          className="bg-card border-input w-40 rounded-lg [color-scheme:light] dark:[color-scheme:dark]"
          onChange={(event) => onFiltersChange({ ...filters, createdAtLte: toIsoBound(event.target.value, true) })}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="activity-sort-filter" className="text-muted-foreground text-xs">
          Sort
        </Label>
        <Select
          value={sortDirection}
          onValueChange={(value) => onFiltersChange({ ...filters, sortDirection: value === 'asc' ? 'asc' : undefined })}
        >
          <SelectTrigger id="activity-sort-filter" className="bg-card w-40 cursor-pointer rounded-lg">
            <SelectValue>{SORT_LABELS[sortDirection]}</SelectValue>
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false} align="start">
            <SelectItem value="desc">{SORT_LABELS.desc}</SelectItem>
            <SelectItem value="asc">{SORT_LABELS.asc}</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

export default ActivityLogFilters
