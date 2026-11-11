import type { ReactElement } from 'react'
import type { SpaceQueueCounts } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { DropdownMenuCheckboxItem } from '@safe-global/views/components/ui/dropdown-menu'
import { useChain } from '@/hooks/useChains'
import { sortByCount, toggleValue } from '../utils'

type NetworkOptionsProps = {
  counts?: SpaceQueueCounts
  selected: string[]
  onChange: (selected: string[]) => void
}

export const NetworkName = ({ chainId }: { chainId: string }): ReactElement => {
  const chain = useChain(chainId)
  return <>{chain?.chainName ?? chainId}</>
}

const NetworkOptionItem = ({
  chainId,
  count,
  checked,
  onToggle,
}: {
  chainId: string
  count: number
  checked: boolean
  onToggle: () => void
}): ReactElement => {
  const chain = useChain(chainId)
  return (
    <DropdownMenuCheckboxItem checked={checked} onCheckedChange={onToggle}>
      {chain?.chainLogoUri && <img src={chain.chainLogoUri} alt="" className="size-4 rounded-full" />}
      <span className="truncate">{chain?.chainName ?? chainId}</span>
      <span className="ml-auto pl-6 tabular-nums text-muted-foreground">{count}</span>
    </DropdownMenuCheckboxItem>
  )
}

/** The Network filter's checkboxes, in the Filter menu. */
const NetworkOptions = ({ counts, selected, onChange }: NetworkOptionsProps): ReactElement => {
  const options = sortByCount(counts?.chains ?? [])

  if (options.length === 0) {
    return <p className="px-2 py-1.5 text-sm text-muted-foreground">No networks</p>
  }

  return (
    <>
      {options.map(({ chainId, count }) => (
        <NetworkOptionItem
          key={chainId}
          chainId={chainId}
          count={count}
          checked={selected.includes(chainId)}
          onToggle={() => onChange(toggleValue(chainId, selected))}
        />
      ))}
    </>
  )
}

export default NetworkOptions
