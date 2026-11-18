import type { ReactNode } from 'react'
import { Columns3, Rows3, Search, X } from 'lucide-react'
import { Badge } from '@safe-global/views/components/ui/badge'
import { Button } from '@safe-global/views/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@safe-global/views/components/ui/dropdown-menu'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@safe-global/views/components/ui/input-group'
import { DEFI_V1_COPY } from '../copy'
import type { GroupBy } from '../types'

const COPY = DEFI_V1_COPY.toolbar
const GROUP_OPTIONS = Object.keys(COPY.groupByOption) as Exclude<GroupBy, 'none'>[]

export const OpportunityToolbar = ({
  search,
  onSearch,
  groupBy,
  onGroupBy,
  compareCount,
  onCompare,
  hasInvestments,
  invest,
}: {
  search: string
  onSearch: (value: string) => void
  groupBy: GroupBy
  onGroupBy: (value: GroupBy) => void
  compareCount: number
  onCompare: () => void
  hasInvestments: boolean
  invest: ReactNode
}) => (
  <div className="flex flex-wrap items-center gap-3" data-testid="opportunity-toolbar">
    <InputGroup variant="search" className="min-w-48 flex-1 @max-[640px]:basis-full">
      <InputGroupAddon align="inline-start">
        <Search className="size-4" />
      </InputGroupAddon>
      <InputGroupInput
        type="search"
        aria-label="Search opportunities"
        placeholder={COPY.searchPlaceholder}
        value={search}
        maxLength={100}
        onChange={(event) => onSearch(event.target.value)}
      />
      {search && (
        <InputGroupAddon align="inline-end">
          <InputGroupButton variant="ghost" size="icon-xs" aria-label="Clear search" onClick={() => onSearch('')}>
            <X />
          </InputGroupButton>
        </InputGroupAddon>
      )}
    </InputGroup>
    <div className="flex flex-wrap items-center gap-2">
      {compareCount > 1 && (
        <Button variant="outline" onClick={onCompare} data-testid="compare">
          <Columns3 />
          {COPY.compare}
          <Badge variant="subtle">{compareCount}</Badge>
        </Button>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="outline" data-testid="group-by" />}>
          <Rows3 />
          {groupBy === 'none' ? COPY.groupBy : `${COPY.groupBy}: ${COPY.groupByOption[groupBy]}`}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuGroup>
            <DropdownMenuLabel>{COPY.groupBy}</DropdownMenuLabel>
            <DropdownMenuRadioGroup value={groupBy} onValueChange={(value) => onGroupBy(value as GroupBy)}>
              <DropdownMenuRadioItem value="none">
                {hasInvestments ? DEFI_V1_COPY.sections.investments : DEFI_V1_COPY.sections.opportunities}
              </DropdownMenuRadioItem>
              {GROUP_OPTIONS.map((option) => (
                <DropdownMenuRadioItem
                  key={option}
                  value={option}
                  onClick={() => option === groupBy && onGroupBy('none')}
                >
                  {COPY.groupByOption[option]}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      {invest}
    </div>
  </div>
)
