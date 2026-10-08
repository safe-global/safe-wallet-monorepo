import { format } from 'date-fns'
import useGetSpaceAuditLogActors from '../../hooks/useGetSpaceAuditLogActors'
import { useMemberNameResolver } from '../../hooks/useMemberNameResolver'
import {
  getDateFilterValidation,
  toDateInputValue,
  toIsoBound,
} from '@views/features/spaces/components/SpaceActivityLog/dateFilters'
import {
  ActivityLogFiltersView,
  ALL_ACTORS,
} from '@views/features/spaces/components/SpaceActivityLog/ActivityLogFiltersView'

export type ActivityLogFilterState = {
  actorUserId?: number
  createdAtGte?: string
  createdAtLte?: string
  sortDirection?: 'asc' | 'desc'
}

export const EMPTY_FILTERS: ActivityLogFilterState = {}

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

  // Activity is historical, so neither bound may be in the future.
  const today = format(new Date(), 'yyyy-MM-dd')
  const validation = getDateFilterValidation(filters.createdAtGte, filters.createdAtLte, today)
  // Cap From at the To date, but never let a (typed) future To re-open it past today.
  const toDateBound = toDateInputValue(filters.createdAtLte)
  const fromDateMax = toDateBound && toDateBound < today ? toDateBound : today

  return (
    <ActivityLogFiltersView
      actorValue={filters.actorUserId !== undefined ? String(filters.actorUserId) : ALL_ACTORS}
      selectedActorLabel={selectedActor ? getActorLabel(selectedActor.actorUserId, selectedActor.actor) : undefined}
      actorOptions={actors.map((actor) => ({
        value: String(actor.actorUserId),
        label: getActorLabel(actor.actorUserId, actor.actor),
      }))}
      onActorChange={(value) =>
        onFiltersChange({ ...filters, actorUserId: value === ALL_ACTORS ? undefined : Number(value) })
      }
      fromValue={toDateInputValue(filters.createdAtGte)}
      fromMax={fromDateMax}
      fromError={validation.fromError}
      onFromChange={(value) => onFiltersChange({ ...filters, createdAtGte: toIsoBound(value, false) })}
      toValue={toDateInputValue(filters.createdAtLte)}
      toMin={toDateInputValue(filters.createdAtGte) || undefined}
      toMax={today}
      toError={validation.toError}
      onToChange={(value) => onFiltersChange({ ...filters, createdAtLte: toIsoBound(value, true) })}
      sortDirection={sortDirection}
      onSortChange={(value) => onFiltersChange({ ...filters, sortDirection: value === 'asc' ? 'asc' : undefined })}
    />
  )
}

export default ActivityLogFilters
