import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import type { SafeListSortColumn, SafeListSortDirection } from '@/hooks/safes'
import { cn } from '@/utils/cn'
import { SAFE_TABLE_GRID } from './constants'

type SafeTableHeaderProps = {
  column: SafeListSortColumn
  direction: SafeListSortDirection
  onSort: (column: SafeListSortColumn) => void
}

const SortIcon = ({ active, direction }: { active: boolean; direction: SafeListSortDirection }) => {
  if (!active) return null
  const Icon = direction === 'asc' ? ArrowUpwardIcon : ArrowDownwardIcon
  return <Icon sx={{ fontSize: 14 }} />
}

const labelCls = 'text-muted-foreground text-xs font-semibold uppercase tracking-wide'

const SafeTableHeader = ({ column, direction, onSort }: SafeTableHeaderProps) => (
  <div className={cn(SAFE_TABLE_GRID, 'bg-card border-border sticky top-0 z-10 border-b px-4 py-2.5')}>
    <button
      type="button"
      onClick={() => onSort('name')}
      className={cn(labelCls, 'hover:text-foreground flex items-center gap-1')}
      data-testid="sort-by-name"
    >
      Account
      <SortIcon active={column === 'name'} direction={direction} />
    </button>
    <span className={labelCls}>Chains</span>
    <button
      type="button"
      onClick={() => onSort('balance')}
      className={cn(labelCls, 'hover:text-foreground flex items-center justify-end gap-1')}
      data-testid="sort-by-balance"
    >
      Balance
      <SortIcon active={column === 'balance'} direction={direction} />
    </button>
    <span className={cn(labelCls, 'text-right')}>Threshold</span>
    <span />
  </div>
)

export default SafeTableHeader
