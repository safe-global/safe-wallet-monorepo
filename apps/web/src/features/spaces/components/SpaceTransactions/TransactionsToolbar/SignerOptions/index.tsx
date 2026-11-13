import type { ReactElement } from 'react'
import type { SpaceQueueCounts } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { DropdownMenuCheckboxItem } from '@safe-global/views/components/ui/dropdown-menu'
import Identicon from '@safe-global/views/components/common/Identicon'
import { useSignerName } from '../useSignerName'
import { isSameSigner, sortByCount, toggleValue } from '../utils'

type SignerOptionsProps = {
  counts?: SpaceQueueCounts
  selected: string[]
  onChange: (selected: string[]) => void
}

const SignerOptionItem = ({
  address,
  chainIds,
  count,
  checked,
  onToggle,
}: {
  address: string
  chainIds: string[]
  count: number
  checked: boolean
  onToggle: () => void
}): ReactElement => {
  const name = useSignerName(address, chainIds)
  return (
    <DropdownMenuCheckboxItem checked={checked} onCheckedChange={onToggle}>
      <Identicon address={address} size={16} />
      <span className="truncate">{name}</span>
      <span className="ml-auto pl-6 tabular-nums text-muted-foreground">{count}</span>
    </DropdownMenuCheckboxItem>
  )
}

/** The Signer filter's checkboxes, in the Filter menu: the signers a queued transaction still awaits. */
const SignerOptions = ({ counts, selected, onChange }: SignerOptionsProps): ReactElement => {
  const options = sortByCount(counts?.signers ?? [])
  const chainIds = (counts?.chains ?? []).map(({ chainId }) => chainId)

  if (options.length === 0) {
    return <p className="px-2 py-1.5 text-sm text-muted-foreground">No signers to wait on</p>
  }

  return (
    <>
      {options.map(({ address, count }) => (
        <SignerOptionItem
          key={address}
          address={address}
          chainIds={chainIds}
          count={count}
          checked={selected.some((other) => isSameSigner(other, address))}
          onToggle={() => onChange(toggleValue(address, selected, isSameSigner))}
        />
      ))}
    </>
  )
}

export default SignerOptions
