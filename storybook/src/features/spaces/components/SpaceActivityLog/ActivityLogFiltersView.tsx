import type { ReactNode } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export const ALL_ACTORS = 'all'
const ALL_ACTORS_LABEL = 'All members'

const SORT_LABELS: Record<'asc' | 'desc', string> = {
  desc: 'Newest first',
  asc: 'Oldest first',
}

export type ActivityLogActorOption = {
  value: string
  label: string
}

export type ActivityLogFiltersViewProps = {
  actorValue: string
  selectedActorLabel?: string
  actorOptions: ActivityLogActorOption[]
  onActorChange: (value: string | null) => void
  fromValue: string
  fromMax: string
  fromError?: string
  onFromChange: (value: string) => void
  toValue: string
  toMin?: string
  toMax: string
  toError?: string
  onToChange: (value: string) => void
  sortDirection: 'asc' | 'desc'
  onSortChange: (value: string | null) => void
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
  error,
  onValueChange,
}: {
  id: string
  label: string
  value: string
  min?: string
  max?: string
  error?: string
  onValueChange: (value: string) => void
}) {
  return (
    <FilterField id={id} label={label}>
      <Input
        id={id}
        type="date"
        variant="surface"
        // No radius/height utilities here on purpose: Input's defaults (rounded-md, h-9) are the same
        // as SelectTrigger's, which is what keeps this field flush with the selects on the same row.
        // The rest is layout plus the colour scheme the native date picker needs per theme.
        className="w-40 [color-scheme:light] dark:[color-scheme:dark] [&~p]:w-40 [&~p]:text-xs"
        value={value}
        min={min}
        max={max}
        error={error}
        onChange={(event) => onValueChange(event.target.value)}
      />
    </FilterField>
  )
}

export function ActivityLogFiltersView({
  actorValue,
  selectedActorLabel,
  actorOptions,
  onActorChange,
  fromValue,
  fromMax,
  fromError,
  onFromChange,
  toValue,
  toMin,
  toMax,
  toError,
  onToChange,
  sortDirection,
  onSortChange,
}: ActivityLogFiltersViewProps) {
  return (
    <div data-testid="activity-log-filters" className="mb-4 flex flex-wrap items-start gap-3">
      <FilterField id="activity-actor-filter" label="Member">
        <Select value={actorValue} onValueChange={(value) => onActorChange(value)}>
          <SelectTrigger id="activity-actor-filter" className="w-48 cursor-pointer">
            <SelectValue placeholder={ALL_ACTORS_LABEL}>
              <span className="truncate">
                {selectedActorLabel !== undefined ? selectedActorLabel : ALL_ACTORS_LABEL}
              </span>
            </SelectValue>
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false} align="start">
            <SelectItem value={ALL_ACTORS}>{ALL_ACTORS_LABEL}</SelectItem>
            {actorOptions.map((actor) => (
              <SelectItem key={actor.value} value={actor.value}>
                {actor.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterField>

      <DateFilter
        id="activity-from-filter"
        label="From"
        value={fromValue}
        max={fromMax}
        error={fromError}
        onValueChange={onFromChange}
      />

      <DateFilter
        id="activity-to-filter"
        label="To"
        value={toValue}
        min={toMin}
        max={toMax}
        error={toError}
        onValueChange={onToChange}
      />

      <FilterField id="activity-sort-filter" label="Sort">
        <Select value={sortDirection} onValueChange={(value) => onSortChange(value)}>
          <SelectTrigger id="activity-sort-filter" className="w-40 cursor-pointer">
            <SelectValue>{SORT_LABELS[sortDirection]}</SelectValue>
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false} align="start">
            <SelectItem value="desc">{SORT_LABELS.desc}</SelectItem>
            <SelectItem value="asc">{SORT_LABELS.asc}</SelectItem>
          </SelectContent>
        </Select>
      </FilterField>
    </div>
  )
}
