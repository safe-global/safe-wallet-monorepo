import type { ReactElement } from 'react'
import Identicon from '@safe-global/views/components/common/Identicon'
import FilterOptionItem, {
  NoFilterOptions,
} from '@safe-global/views/features/spaces/components/SpaceQueue/QueueFilters/FilterOptionItem'
import SearchableOptions from '@safe-global/views/features/spaces/components/SpaceQueue/QueueFilters/SearchableOptions'

export type SignerOptionRow = {
  address: string
  name: string
  count: number
  checked: boolean
}

export type SignerOptionsProps = {
  options: SignerOptionRow[]
  onToggle: (address: string) => void
}

/** The Signer filter's checkboxes, in the Filter menu: the signers a queued transaction still awaits */
const SignerOptions = ({ options, onToggle }: SignerOptionsProps): ReactElement => {
  if (options.length === 0) return <NoFilterOptions>No signers to wait on</NoFilterOptions>

  return (
    <SearchableOptions items={options} noun="signers" getText={({ address, name }) => `${name} ${address}`}>
      {(shown) =>
        shown.map(({ address, name, count, checked }) => (
          <FilterOptionItem
            key={address}
            icon={<Identicon address={address} size={16} />}
            label={name}
            count={count}
            checked={checked}
            onToggle={() => onToggle(address)}
          />
        ))
      }
    </SearchableOptions>
  )
}

export default SignerOptions
