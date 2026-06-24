import type { ReactNode } from 'react'
import { format } from 'date-fns'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import useGetSpaceAuditLogActors from '../../hooks/useGetSpaceAuditLogActors'
import { useMemberNameResolver } from '../../hooks/useMemberNameResolver'
import { isInvalidDateRange, toDateInputValue, toIsoBound } from './dateFilters'

export type ActivityLogFilterState = {
  actorUserId?: number
  createdAtGte?: string
  createdAtLte?: string
  sortDirection?: 'asc' | 'desc'
}

export const EMPTY_FILTERS: ActivityLogFilterState = {}

const ALL_ACTORS = 'all'
const ALL_ACTORS_LABEL = 'All members'
const DATE_ERROR_ID = 'activity-date-error'
const DATE_RANGE_ERROR = "'From' date can't be after the 'To' date"

const SORT_LABELS: Record<'asc' | 'desc', string> = {
  desc: 'Newest first',
  asc: 'Oldest first',
}

/** A labelled filter column shared by every control in the row. */
function FilterField({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className="text-muted-foreground text-xs">
        {label}
      </Label>
      {children}
    </div>
  )
}

function DateFilter({
  id,
  label,
  value,
  min,
  max,
  invalid,
  onValueChange,
}: {
  id: string
  label: string
  value: string
  min?: string
  max?: string
  invalid: boolean
  onValueChange: (value: string) => void
}) {
  return (
    <FilterField id={id} label={label}>
      <Input
        id={id}
        type="date"
        className="bg-card dark:bg-card border-input w-40 rounded-lg [color-scheme:light] dark:[color-scheme:dark]"
        value={value}
        min={min}
        max={max}
        aria-invalid={invalid || undefined}
        aria-describedby={invalid ? DATE_ERROR_ID : undefined}
        onChange={(event) => onValueChange(event.target.value)}
      />
    </FilterField>
  )
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
  const resolveMemberName = useMemberNameResolver()

  // Prefer the Team-page display name; fall back to the server label (a raw
  // address for wallet members, an email otherwise) for non-members.
  const getActorLabel = (actorUserId: number, fallback: string) => resolveMemberName(actorUserId) ?? fallback

  const selectedActor = actors.find((actor) => actor.actorUserId === filters.actorUserId)
  const sortDirection = filters.sortDirection ?? 'desc'

  const hasInvalidRange = isInvalidDateRange(filters.createdAtGte, filters.createdAtLte)
  // Activity is historical, so neither bound may be in the future.
  const today = format(new Date(), 'yyyy-MM-dd')
  // Cap From at the To date, but never let a (typed) future To re-open it past today.
  const toDateBound = toDateInputValue(filters.createdAtLte)
  const fromDateMax = toDateBound && toDateBound < today ? toDateBound : today

  return (
    <div className="mb-4 flex flex-col gap-1.5">
      <div data-testid="activity-log-filters" className="flex flex-wrap items-end gap-3">
        <FilterField id="activity-actor-filter" label="Member">
          <Select
            value={filters.actorUserId !== undefined ? String(filters.actorUserId) : ALL_ACTORS}
            onValueChange={(value) =>
              onFiltersChange({ ...filters, actorUserId: value === ALL_ACTORS ? undefined : Number(value) })
            }
          >
            <SelectTrigger id="activity-actor-filter" className="bg-card dark:bg-card w-48 cursor-pointer rounded-lg">
              <SelectValue placeholder={ALL_ACTORS_LABEL}>
                <span className="truncate">
                  {selectedActor ? getActorLabel(selectedActor.actorUserId, selectedActor.actor) : ALL_ACTORS_LABEL}
                </span>
              </SelectValue>
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false} align="start">
              <SelectItem value={ALL_ACTORS}>{ALL_ACTORS_LABEL}</SelectItem>
              {actors.map((actor) => (
                <SelectItem key={actor.actorUserId} value={String(actor.actorUserId)}>
                  {getActorLabel(actor.actorUserId, actor.actor)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterField>

        <DateFilter
          id="activity-from-filter"
          label="From"
          value={toDateInputValue(filters.createdAtGte)}
          max={fromDateMax}
          invalid={hasInvalidRange}
          onValueChange={(value) => onFiltersChange({ ...filters, createdAtGte: toIsoBound(value, false) })}
        />

        <DateFilter
          id="activity-to-filter"
          label="To"
          value={toDateInputValue(filters.createdAtLte)}
          min={toDateInputValue(filters.createdAtGte) || undefined}
          max={today}
          invalid={hasInvalidRange}
          onValueChange={(value) => onFiltersChange({ ...filters, createdAtLte: toIsoBound(value, true) })}
        />

        <FilterField id="activity-sort-filter" label="Sort">
          <Select
            value={sortDirection}
            onValueChange={(value) =>
              onFiltersChange({ ...filters, sortDirection: value === 'asc' ? 'asc' : undefined })
            }
          >
            <SelectTrigger id="activity-sort-filter" className="bg-card dark:bg-card w-40 cursor-pointer rounded-lg">
              <SelectValue>{SORT_LABELS[sortDirection]}</SelectValue>
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false} align="start">
              <SelectItem value="desc">{SORT_LABELS.desc}</SelectItem>
              <SelectItem value="asc">{SORT_LABELS.asc}</SelectItem>
            </SelectContent>
          </Select>
        </FilterField>
      </div>

      {hasInvalidRange && (
        <p id={DATE_ERROR_ID} role="alert" className="text-destructive text-sm">
          {DATE_RANGE_ERROR}
        </p>
      )}
    </div>
  )
}

export default ActivityLogFilters
