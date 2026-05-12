import { Typography } from '@/components/ui/typography'
import SelectAllToggle from './SelectAllToggle'
import { SAFE_ACCOUNTS_LIMIT } from '../Sidebar/constants'
import type { SelectAllState } from './SelectAllToggle'

interface SelectAllHeaderProps {
  state: SelectAllState
  selectedCount: number
  total: number
  onToggle: (check: boolean) => void
  capReached: boolean
}

const SelectAllHeader = ({ state, selectedCount, total, onToggle, capReached }: SelectAllHeaderProps) => {
  if (total === 0) return null

  return (
    <div className="flex items-center justify-between pb-1">
      <SelectAllToggle
        state={state}
        count={selectedCount}
        total={total}
        onToggle={onToggle}
        label="Select all"
        showCount
        countTooltip="Multi-chain safes count once per network"
        testId="select-all-global"
      />
      {capReached && (
        <Typography variant="paragraph" color="muted" className="text-xs">
          Limit of {SAFE_ACCOUNTS_LIMIT} reached
        </Typography>
      )}
    </div>
  )
}

export default SelectAllHeader
