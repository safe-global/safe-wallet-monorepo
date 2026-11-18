import type { ReactElement } from 'react'
import FilterOptionItem, {
  NoFilterOptions,
} from '@safe-global/views/features/spaces/components/SpaceQueue/QueueFilters/FilterOptionItem'

export type NetworkOptionRow = {
  chainId: string
  name: string
  logoUri?: string | null
  count: number
  checked: boolean
}

export type NetworkOptionsProps = {
  options: NetworkOptionRow[]
  onToggle: (chainId: string) => void
}

/** The Network filter's checkboxes, in the Filter menu */
const NetworkOptions = ({ options, onToggle }: NetworkOptionsProps): ReactElement => {
  if (options.length === 0) return <NoFilterOptions>No networks</NoFilterOptions>

  return (
    <>
      {options.map(({ chainId, name, logoUri, count, checked }) => (
        <FilterOptionItem
          key={chainId}
          icon={logoUri ? <img src={logoUri} alt="" className="size-4 rounded-full" /> : undefined}
          label={name}
          count={count}
          checked={checked}
          onToggle={() => onToggle(chainId)}
        />
      ))}
    </>
  )
}

export default NetworkOptions
