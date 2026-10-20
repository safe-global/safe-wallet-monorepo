import type { ReactNode } from 'react'

export type FilterOption = {
  value: string
  label: string
  icon?: ReactNode
  count?: number
}

export type FilterDimension = {
  id: string
  label: string
  options: FilterOption[]
}

/** Selected option values per dimension id. A missing or empty list means the dimension isn't filtering. */
export type FilterSelection = Record<string, string[]>

export type AppliedFilter = {
  id: string
  label: string
  values: string[]
}

export const toggleValue = (selection: string[], value: string): string[] =>
  selection.includes(value) ? selection.filter((item) => item !== value) : [...selection, value]

export const formatFilterValues = (values: string[], visible = 2): string =>
  values.length > visible ? `${values.slice(0, visible).join(', ')} +${values.length - visible}` : values.join(', ')

export const getAppliedFilters = (dimensions: FilterDimension[], selection: FilterSelection): AppliedFilter[] =>
  dimensions
    .map(({ id, label, options }) => ({
      id,
      label,
      values: options.filter((option) => selection[id]?.includes(option.value)).map((option) => option.label),
    }))
    .filter((filter) => filter.values.length > 0)
