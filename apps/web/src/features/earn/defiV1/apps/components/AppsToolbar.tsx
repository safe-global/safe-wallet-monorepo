import { useState } from 'react'
import { LayoutGrid, ListFilter, Rows3, Search, Table2, X } from 'lucide-react'
import { Badge } from '@safe-global/views/components/ui/badge'
import { Button } from '@safe-global/views/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@safe-global/views/components/ui/dropdown-menu'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@safe-global/views/components/ui/input-group'
import { Tabs, TabsList, TabsTrigger } from '@safe-global/views/components/ui/tabs'
import BatchIcon from '@/public/images/apps/batch-icon.svg'
import type { AppsGroupBy } from '../catalogue'
import type { AppsView } from '../context'
import { APPS_V1_COPY } from '../copy'

const COPY = APPS_V1_COPY
const GROUP_OPTIONS = Object.keys(COPY.groupByOption) as AppsGroupBy[]
const VIEWS: { value: AppsView; icon: typeof Table2 }[] = [
  { value: 'table', icon: Table2 },
  { value: 'grid', icon: LayoutGrid },
]

const SearchInput = ({ onChange }: { onChange: (value: string) => void }) => {
  const [value, setValue] = useState('')
  const update = (next: string) => {
    setValue(next)
    onChange(next)
  }
  return (
    <InputGroup variant="search" className="min-w-48 flex-1 @max-[640px]:basis-full">
      <InputGroupAddon align="inline-start">
        <Search className="size-4" />
      </InputGroupAddon>
      <InputGroupInput
        type="search"
        aria-label={COPY.searchLabel}
        placeholder={COPY.searchPlaceholder}
        autoComplete="off"
        value={value}
        maxLength={100}
        onChange={(event) => update(event.target.value)}
        data-testid="apps-search"
      />
      {value && (
        <InputGroupAddon align="inline-end">
          <InputGroupButton variant="ghost" size="icon-xs" aria-label="Clear search" onClick={() => update('')}>
            <X />
          </InputGroupButton>
        </InputGroupAddon>
      )}
    </InputGroup>
  )
}

const FilterMenu = ({
  categories,
  selected,
  onCategories,
  batchOnly,
  onBatchOnly,
}: {
  categories: string[]
  selected: string[]
  onCategories: (value: string[]) => void
  batchOnly: boolean
  onBatchOnly: (value: boolean) => void
}) => {
  const active = selected.length + (batchOnly ? 1 : 0)
  const toggle = (category: string, checked: boolean) =>
    onCategories(checked ? [...selected, category] : selected.filter((item) => item !== category))

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" data-testid="apps-filters" />}>
        <ListFilter />
        {COPY.filters}
        {active > 0 && <Badge variant="subtle">{active}</Badge>}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-h-96 w-60 overflow-y-auto">
        <DropdownMenuGroup>
          <DropdownMenuLabel>{COPY.optimizedWith}</DropdownMenuLabel>
          <DropdownMenuCheckboxItem checked={batchOnly} onCheckedChange={onBatchOnly}>
            <BatchIcon />
            {COPY.batch}
          </DropdownMenuCheckboxItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel>{COPY.category}</DropdownMenuLabel>
          {categories.length === 0 && <DropdownMenuItem disabled>{COPY.noCategories}</DropdownMenuItem>}
          {categories.map((category) => (
            <DropdownMenuCheckboxItem
              key={category}
              checked={selected.includes(category)}
              onCheckedChange={(checked) => toggle(category, checked)}
            >
              {category}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuGroup>
        {active > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                onCategories([])
                onBatchOnly(false)
              }}
            >
              {COPY.clearFilters}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export const AppsToolbar = ({
  onQuery,
  categories,
  selectedCategories,
  onCategories,
  batchOnly,
  onBatchOnly,
  groupBy,
  onGroupBy,
  view,
  onView,
}: {
  onQuery: (value: string) => void
  categories: string[]
  selectedCategories: string[]
  onCategories: (value: string[]) => void
  batchOnly: boolean
  onBatchOnly: (value: boolean) => void
  groupBy: AppsGroupBy
  onGroupBy: (value: AppsGroupBy) => void
  view: AppsView
  onView: (value: AppsView) => void
}) => (
  <div className="@container" data-testid="apps-toolbar">
    <div className="flex flex-wrap items-center gap-3">
      <SearchInput onChange={onQuery} />
      <div className="flex flex-wrap items-center gap-2">
        <FilterMenu
          categories={categories}
          selected={selectedCategories}
          onCategories={onCategories}
          batchOnly={batchOnly}
          onBatchOnly={onBatchOnly}
        />
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="outline" data-testid="apps-group-by" />}>
            <Rows3 />
            {`${COPY.groupBy}: ${COPY.groupByOption[groupBy]}`}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuGroup>
              <DropdownMenuLabel>{COPY.groupBy}</DropdownMenuLabel>
              <DropdownMenuRadioGroup value={groupBy} onValueChange={(value) => onGroupBy(value as AppsGroupBy)}>
                {GROUP_OPTIONS.map((option) => (
                  <DropdownMenuRadioItem key={option} value={option}>
                    {COPY.groupByOption[option]}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        <Tabs value={view} onValueChange={(value) => onView(value as AppsView)}>
          <TabsList variant="toggle" aria-label="View">
            {VIEWS.map(({ value, icon: Icon }) => (
              <TabsTrigger key={value} value={value} data-testid={`apps-view-${value}`}>
                <Icon />
                <span className="@max-[480px]:sr-only">{COPY.view[value]}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>
    </div>
  </div>
)
