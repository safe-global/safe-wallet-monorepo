import { Fragment, type ReactElement } from 'react'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { Button } from '@safe-global/views/components/ui/button'
import { Chip } from '@safe-global/views/components/ui/chip'
import type { QueueFilterKey, QueueStatusOption } from '@safe-global/views/features/spaces/components/SpaceQueue/types'
import { STATUS_OPTION_LABELS } from '@safe-global/views/features/spaces/components/SpaceQueue/QueueFilters/labels'

const MAX_CHIP_VALUES = 2

const FilterChip = ({ label, values, onDelete }: { label: string; values: string[]; onDelete: () => void }) => {
  const shown = values.slice(0, MAX_CHIP_VALUES)
  const hidden = values.length - shown.length
  return (
    <Chip variant="filter" size="xl" onDelete={onDelete}>
      <span className="text-muted-foreground">{label}:</span>
      {shown.map((value, index) => (
        <Fragment key={index}>
          {index > 0 && ', '}
          {value}
        </Fragment>
      ))}
      {hidden > 0 && ` +${hidden}`}
    </Chip>
  )
}

export type FilterChipsProps = {
  /** The address is shown for a Safe without a name */
  safes: { safeAddress: string; name: string }[]
  statuses: QueueStatusOption[]
  networkNames: string[]
  signerNames: string[]
  onRemove: (filter: QueueFilterKey) => void
  onClear: () => void
}

/** One chip per filter in use, naming up to two values, and a button clearing them all */
const FilterChips = ({
  safes,
  statuses,
  networkNames,
  signerNames,
  onRemove,
  onClear,
}: FilterChipsProps): ReactElement | null => {
  const chips: { filter: QueueFilterKey; label: string; values: string[] }[] = [
    {
      filter: 'safes',
      label: 'Safe',
      values: safes.map(({ safeAddress, name }) => name || shortenAddress(safeAddress)),
    },
    { filter: 'statuses', label: 'Urgency', values: statuses.map((option) => STATUS_OPTION_LABELS[option].chip) },
    { filter: 'chainIds', label: 'Network', values: networkNames },
    { filter: 'signers', label: 'Signer', values: signerNames },
  ]
  const shownChips = chips.filter(({ values }) => values.length > 0)

  if (shownChips.length === 0) {
    return null
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {shownChips.map(({ filter, label, values }) => (
        <FilterChip key={filter} label={label} values={values} onDelete={() => onRemove(filter)} />
      ))}
      <Button variant="ghost" size="sm" onClick={onClear}>
        Clear
      </Button>
    </div>
  )
}

export default FilterChips
