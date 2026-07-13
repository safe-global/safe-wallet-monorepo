import { X } from 'lucide-react'
import type { SafeApp as SafeAppData } from '@safe-global/store/gateway/AUTO_GENERATED/safe-apps'

import SearchField from '@/components/common/SearchField'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Field, FieldLabel } from '@/components/ui/field'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { getUniqueTags } from '@/components/safe-apps/utils'
import BatchIcon from '@/public/images/apps/batch-icon.svg'
import { cn } from '@/utils/cn'
import css from './styles.module.css'

export type safeAppCatogoryOptionType = {
  label: string
  value: string
}

type SafeAppsFiltersProps = {
  onChangeQuery: (newQuery: string) => void
  onChangeFilterCategory: (category: string[]) => void
  onChangeOptimizedWithBatch: (optimizedWithBatch: boolean) => void
  selectedCategories: string[]
  safeAppsList: SafeAppData[]
}

const SafeAppsFilters = ({
  onChangeQuery,
  onChangeFilterCategory,
  onChangeOptimizedWithBatch,
  selectedCategories,
  safeAppsList,
}: SafeAppsFiltersProps) => {
  const categoryOptions = getCategoryOptions(safeAppsList)

  return (
    <div className={`grid grid-cols-12 items-end gap-4 ${css.filterContainer}`}>
      <div className="col-span-12 md:col-span-6">
        <Label htmlFor="search-by-name" className="mb-1.5">
          Search
        </Label>
        <SearchField
          id="search-by-name"
          placeholder="Search by name or category"
          aria-label="Search Safe App by name"
          autoComplete="off"
          onChange={(e) => {
            onChangeQuery(e.target.value)
          }}
        />
      </div>

      {/* Select Category */}
      <div className="relative col-span-12 sm:col-span-6 md:col-span-3">
        <Label htmlFor="safe-app-category-selector" className="mb-1.5">
          Category
        </Label>
        <Select
          multiple
          value={selectedCategories}
          onValueChange={(value) => {
            onChangeFilterCategory(value as string[])
          }}
        >
          <SelectTrigger
            id="safe-app-category-selector"
            className={cn(
              'w-full pr-[18px] focus-visible:ring-1 focus-visible:ring-ring',
              // eslint-disable-next-line no-restricted-syntax -- faithful css-module port of `.fieldControl`, pixel-identical; bespoke sizing/surface has no Select variant
              'h-[var(--space-5)]! border-[var(--border)] bg-[var(--card)] shadow-none focus-visible:border-[var(--ring)]',
            )}
          >
            <SelectValue className={selectedCategories.length === 0 ? css.selectPlaceholder : undefined}>
              {selectedCategories.length === 0 ? 'Select category' : `${selectedCategories.length} categories selected`}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {categoryOptions.length > 0 ? (
              categoryOptions.map((category) => (
                <SelectItem key={category.value} value={category.value} className="text-sm">
                  <Checkbox checked={selectedCategories.includes(category.value)} className="pointer-events-none" />
                  {category.label}
                </SelectItem>
              ))
            ) : (
              <SelectItem value="" disabled className="text-sm">
                No categories defined
              </SelectItem>
            )}
          </SelectContent>
        </Select>

        {/* clear selected categories button */}
        {selectedCategories.length > 0 && (
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="clear selected categories"
                  onClick={() => {
                    onChangeFilterCategory([])
                  }}
                  className="absolute top-[28px] right-[28px]"
                />
              }
            >
              <X className="size-4" />
            </TooltipTrigger>
            <TooltipContent>clear selected categories</TooltipContent>
          </Tooltip>
        )}
      </div>

      {/* Optimized with Batch Transaction */}
      <div className="col-span-12 sm:col-span-6 md:col-span-3">
        <Tooltip>
          <TooltipTrigger render={<div className="inline-block" />}>
            <Label className={`${css.optimizedWithBatchLabel} mb-1.5`}>Optimized with</Label>
            <Field orientation="horizontal">
              <Checkbox id="optimized-with-batch" onCheckedChange={(value) => onChangeOptimizedWithBatch(value)} />
              <FieldLabel htmlFor="optimized-with-batch" className="flex items-center gap-2 font-normal">
                <span>Batch transactions</span> <BatchIcon />
              </FieldLabel>
            </Field>
          </TooltipTrigger>
          <TooltipContent className="text-center">
            Merge multiple transactions into one to save time and gas fees inside apps offering this feature
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  )
}

export default SafeAppsFilters

export const getCategoryOptions = (safeAppList: SafeAppData[]): safeAppCatogoryOptionType[] => {
  return getUniqueTags(safeAppList).map((category) => ({
    label: category,
    value: category,
  }))
}
