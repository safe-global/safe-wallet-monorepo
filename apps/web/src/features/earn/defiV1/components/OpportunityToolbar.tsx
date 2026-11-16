import type { ReactNode } from 'react'
import { Columns3, ListFilter } from 'lucide-react'
import { Badge } from '@safe-global/views/components/ui/badge'
import { Button } from '@safe-global/views/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@safe-global/views/components/ui/dropdown-menu'
import { DEFI_V1_COPY } from '../copy'
import { activeFilterCount, NO_FILTERS, type ListFilters } from '../shelf'
import type { RiskLevel } from '../types'

const COPY = DEFI_V1_COPY.toolbar
const RISKS = Object.keys(DEFI_V1_COPY.risk) as RiskLevel[]

const toggle = <T,>(values: T[], value: T): T[] =>
  values.includes(value) ? values.filter((item) => item !== value) : [...values, value]

const FilterGroup = <T extends string>({
  label,
  options,
  selected,
  format = (value) => value,
  onChange,
}: {
  label: string
  options: T[]
  selected: T[]
  format?: (value: T) => string
  onChange: (next: T[]) => void
}) => (
  <DropdownMenuGroup>
    <DropdownMenuLabel>{label}</DropdownMenuLabel>
    {options.map((option) => (
      <DropdownMenuCheckboxItem
        key={option}
        checked={selected.includes(option)}
        onCheckedChange={() => onChange(toggle(selected, option))}
      >
        {format(option)}
      </DropdownMenuCheckboxItem>
    ))}
  </DropdownMenuGroup>
)

export const OpportunityToolbar = ({
  filters,
  onFilters,
  assets,
  chains,
  compareCount,
  onCompare,
  policy,
  onDeposit,
}: {
  filters: ListFilters
  onFilters: (value: ListFilters) => void
  assets: string[]
  chains: string[]
  compareCount: number
  onCompare: () => void
  policy: ReactNode
  onDeposit?: () => void
}) => {
  const filterCount = activeFilterCount(filters)

  return (
    <div className="flex flex-wrap items-center justify-end gap-3" data-testid="opportunity-toolbar">
      <div className="flex flex-wrap items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="outline" data-testid="filters" />}>
            <ListFilter />
            {COPY.filters}
            {filterCount > 0 && <Badge variant="subtle">{filterCount}</Badge>}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-48">
            <DropdownMenuGroup>
              <DropdownMenuLabel>{COPY.investments}</DropdownMenuLabel>
              <DropdownMenuCheckboxItem
                checked={filters.investedOnly}
                onCheckedChange={(checked) => onFilters({ ...filters, investedOnly: checked })}
              >
                {COPY.investedOnly}
              </DropdownMenuCheckboxItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <FilterGroup
              label={COPY.asset}
              options={assets}
              selected={filters.assets}
              onChange={(next) => onFilters({ ...filters, assets: next })}
            />
            <DropdownMenuSeparator />
            <FilterGroup
              label={COPY.network}
              options={chains}
              selected={filters.chains}
              onChange={(next) => onFilters({ ...filters, chains: next })}
            />
            <DropdownMenuSeparator />
            <FilterGroup
              label={DEFI_V1_COPY.compare.risk}
              options={RISKS}
              selected={filters.risks}
              format={(risk) => DEFI_V1_COPY.risk[risk]}
              onChange={(next) => onFilters({ ...filters, risks: next })}
            />
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuLabel>{COPY.exit}</DropdownMenuLabel>
              <DropdownMenuCheckboxItem
                checked={filters.sameDay}
                onCheckedChange={(checked) => onFilters({ ...filters, sameDay: checked })}
              >
                {COPY.sameDay}
              </DropdownMenuCheckboxItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuLabel>{COPY.access}</DropdownMenuLabel>
              <DropdownMenuCheckboxItem
                checked={filters.openOnly}
                onCheckedChange={(checked) => onFilters({ ...filters, openOnly: checked })}
              >
                {COPY.openOnly}
              </DropdownMenuCheckboxItem>
            </DropdownMenuGroup>
            {filterCount > 0 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onFilters(NO_FILTERS)}>{COPY.clearFilters}</DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="outline"
          disabled={compareCount < 2}
          onClick={onCompare}
          title={compareCount < 2 ? COPY.compareHint : undefined}
          data-testid="compare"
        >
          <Columns3 />
          {COPY.compare}
          {compareCount > 0 && <Badge variant="subtle">{compareCount}</Badge>}
        </Button>
        {policy}
        <Button size="action" disabled={!onDeposit} onClick={onDeposit} data-testid="toolbar-deposit">
          {COPY.deposit}
        </Button>
      </div>
    </div>
  )
}
