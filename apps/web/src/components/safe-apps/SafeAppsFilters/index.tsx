import type { SafeApp as SafeAppData } from '@safe-global/store/gateway/AUTO_GENERATED/safe-apps'
import { getUniqueTags } from '@/components/safe-apps/utils'
import { SafeAppsFiltersView } from '@views/components/safe-apps/SafeAppsFilters/SafeAppsFiltersView'

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
    <SafeAppsFiltersView
      onChangeQuery={onChangeQuery}
      onChangeFilterCategory={onChangeFilterCategory}
      onChangeOptimizedWithBatch={onChangeOptimizedWithBatch}
      selectedCategories={selectedCategories}
      categoryOptions={categoryOptions}
    />
  )
}

export default SafeAppsFilters

export const getCategoryOptions = (safeAppList: SafeAppData[]): safeAppCatogoryOptionType[] => {
  return getUniqueTags(safeAppList).map((category) => ({
    label: category,
    value: category,
  }))
}
