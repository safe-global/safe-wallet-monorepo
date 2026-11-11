import { Fragment, type ReactElement, type ReactNode } from 'react'
import type { SpaceQueueSafe } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { Button } from '@safe-global/views/components/ui/button'
import { Chip } from '@safe-global/views/components/ui/chip'
import { useSafeDisplayName } from '@/hooks/useSafeDisplayName'
import { NO_SPACE_QUEUE_FILTERS, hasSpaceQueueFilters, type SpaceQueueFilters } from '../../../../store/spaceQueueApi'
import { NetworkName } from '../NetworkOptions'
import { useSignerName } from '../useSignerName'
import { getSelectedSafeAddresses, STATUS_OPTION_LABELS } from '../utils'

const MAX_CHIP_VALUES = 2

const SafeName = ({ safe }: { safe: SpaceQueueSafe }): ReactElement => {
  const name = useSafeDisplayName(safe.safeAddress, safe.chainId)
  return <>{name || shortenAddress(safe.safeAddress)}</>
}

const SignerName = ({ address, chainIds }: { address: string; chainIds: string[] }): ReactElement => (
  <>{useSignerName(address, chainIds)}</>
)

const FilterChip = ({
  label,
  values,
  onDelete,
}: {
  label: string
  values: ReactNode[]
  onDelete: () => void
}): ReactElement => {
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

type FilterChipsProps = {
  filters: SpaceQueueFilters
  /** The chains of the queue, to find the signers' names */
  chainIds: string[]
  onChange: (filters: SpaceQueueFilters) => void
}

const FilterChips = ({ filters, chainIds, onChange }: FilterChipsProps): ReactElement | null => {
  if (!hasSpaceQueueFilters(filters)) return null

  return (
    <div className="flex flex-wrap items-center gap-2">
      {filters.safes.length > 0 && (
        <FilterChip
          label="Safe"
          values={getSelectedSafeAddresses(filters.safes).map((safe) => (
            <SafeName key={safe.safeAddress} safe={safe} />
          ))}
          onDelete={() => onChange({ ...filters, safes: [] })}
        />
      )}
      {filters.statuses.length > 0 && (
        <FilterChip
          label="Status"
          values={filters.statuses.map((option) => STATUS_OPTION_LABELS[option].chip)}
          onDelete={() => onChange({ ...filters, statuses: [] })}
        />
      )}
      {filters.chainIds.length > 0 && (
        <FilterChip
          label="Network"
          values={filters.chainIds.map((chainId) => (
            <NetworkName key={chainId} chainId={chainId} />
          ))}
          onDelete={() => onChange({ ...filters, chainIds: [] })}
        />
      )}
      {filters.signers.length > 0 && (
        <FilterChip
          label="Signer"
          values={filters.signers.map((address) => (
            <SignerName key={address} address={address} chainIds={chainIds} />
          ))}
          onDelete={() => onChange({ ...filters, signers: [] })}
        />
      )}
      <Button variant="ghost" size="sm" onClick={() => onChange(NO_SPACE_QUEUE_FILTERS)}>
        Clear
      </Button>
    </div>
  )
}

export default FilterChips
