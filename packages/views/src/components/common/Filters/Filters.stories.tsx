import { useState, type ReactNode } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { CircleCheck, Clock, PenLine, Send, ShieldAlert } from 'lucide-react'
import { Avatar, AvatarFallback } from '@safe-global/views/components/ui/avatar'
import { SearchInput } from '@safe-global/views/components/ui/search-input'
import { ICON_STROKE } from '@safe-global/views/components/common/iconStroke'
import {
  AppliedFilters,
  FilterDropdown,
  FilterDropdownNote,
  FilterMenu,
  toggleValue,
  useFilterSelection,
  type FilterDimension,
  type FilterSelection,
} from '@safe-global/views/components/common/Filters'

const letterIcon = (label: string) => (
  <Avatar className="size-4">
    <AvatarFallback className="text-[10px]">{label[0]}</AvatarFallback>
  </Avatar>
)

const iconClass = 'size-4 text-muted-foreground'

const status: FilterDimension = {
  id: 'status',
  label: 'Status',
  options: [
    { value: 'execute', label: 'Execute', count: 3, icon: <Send className={iconClass} strokeWidth={ICON_STROKE} /> },
    { value: 'sign', label: 'Sign', count: 5, icon: <PenLine className={iconClass} strokeWidth={ICON_STROKE} /> },
    {
      value: 'blocked',
      label: 'Blocked',
      count: 1,
      icon: <ShieldAlert className={iconClass} strokeWidth={ICON_STROKE} />,
    },
    { value: 'waiting', label: 'Waiting', count: 2, icon: <Clock className={iconClass} strokeWidth={ICON_STROKE} /> },
  ],
}

const safe: FilterDimension = {
  id: 'safe',
  label: 'Safe',
  options: ['Treasury', 'Grants', 'Operations', 'Payroll'].map((name, index) => ({
    value: name.toLowerCase(),
    label: name,
    count: [4, 3, 2, 0][index],
    icon: letterIcon(name),
  })),
}

const network: FilterDimension = {
  id: 'network',
  label: 'Network',
  options: ['Ethereum', 'Base', 'Arbitrum'].map((name, index) => ({
    value: name.toLowerCase(),
    label: name,
    count: [6, 3, 2][index],
    icon: letterIcon(name),
  })),
}

const type: FilterDimension = {
  id: 'type',
  label: 'Type',
  options: ['Send', 'Swap', 'Settings change', 'Contract interaction'].map((name, index) => ({
    value: name.toLowerCase(),
    label: name,
    count: [5, 2, 1, 3][index],
    icon: <CircleCheck className={iconClass} strokeWidth={ICON_STROKE} />,
  })),
}

const manySafes: FilterDimension = {
  id: 'safe',
  label: 'Safe',
  options: Array.from({ length: 20 }, (_, index) => {
    const label = `Example Safe with a long name ${index + 1}`
    return { value: `safe-${index + 1}`, label, count: (index * 7) % 11, icon: letterIcon(label) }
  }),
}

const sortedNote = (
  <FilterDropdownNote tooltip="Safes you can execute or sign on come first, most urgent at the top. Safes with nothing for you keep the workspace order.">
    Sorted by actionable transactions
  </FilterDropdownNote>
)

function Toolbar({ initial }: { initial?: FilterSelection }) {
  const filters = useFilterSelection(initial)
  const [search, setSearch] = useState('')
  const dimensions = [status, safe, network, type]
  const dropdownProps = (dimension: FilterDimension) => ({
    dimension,
    selected: filters.selection[dimension.id] ?? [],
    onToggle: (value: string) => filters.toggle(dimension.id, value),
    onClear: () => filters.clear(dimension.id),
  })

  return (
    <div className="flex w-[880px] flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <SearchInput
          className="min-w-48 flex-1"
          aria-label="Search transactions"
          placeholder="Search transactions…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          onClear={() => setSearch('')}
        />
        <FilterDropdown {...dropdownProps(status)} />
        <FilterDropdown {...dropdownProps(safe)} footer={sortedNote} />
        <FilterMenu
          dimensions={dimensions}
          selection={filters.selection}
          onToggle={filters.toggle}
          onReset={filters.reset}
        />
      </div>
      <AppliedFilters
        dimensions={dimensions}
        selection={filters.selection}
        onRemove={filters.clear}
        onClearAll={filters.reset}
      />
    </div>
  )
}

function SingleDropdown({ dimension, footer }: { dimension: FilterDimension; footer?: ReactNode }) {
  const [selected, setSelected] = useState<string[]>([])
  return (
    <FilterDropdown
      dimension={dimension}
      selected={selected}
      onToggle={(value) => setSelected((current) => toggleValue(current, value))}
      onClear={() => setSelected([])}
      footer={footer}
    />
  )
}

const meta = {
  title: 'Components/Common/Filters',
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = { render: () => <Toolbar /> }

export const WithAppliedFilters: Story = {
  render: () => <Toolbar initial={{ status: ['execute', 'sign', 'waiting'], safe: ['grants'] }} />,
}

export const Dropdown: Story = { render: () => <SingleDropdown dimension={status} /> }

export const DropdownWithFooter: Story = { render: () => <SingleDropdown dimension={safe} footer={sortedNote} /> }

export const ManyOptions: Story = { render: () => <SingleDropdown dimension={manySafes} footer={sortedNote} /> }
