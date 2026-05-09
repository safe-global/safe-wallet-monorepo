import { type Dispatch, type SetStateAction, useEffect } from 'react'
import { useRouter } from 'next/router'
import { getCategoryOptions } from '@/components/safe-apps/SafeAppsFilters'
import type { SafeApp as SafeAppData } from '@safe-global/store/gateway/AUTO_GENERATED/safe-apps'

const useCategoryFilter = ({
  safeAppsList,
  selectedCategories,
  setSelectedCategories,
}: {
  safeAppsList: SafeAppData[]
  selectedCategories: string[]
  setSelectedCategories: Dispatch<SetStateAction<string[]>>
}) => {
  const router = useRouter()

  useEffect(() => {
    if (!router.isReady) return

    const categoryOptions = getCategoryOptions(safeAppsList).map((category) => category.value)
    const categoryQuery = Array.isArray(router.query.categories) ? router.query.categories[0] : router.query.categories

    if (categoryQuery && selectedCategories.length === 0) {
      const categoryQueryOptions = categoryQuery.split(',')
      const isCategoryOption = categoryQueryOptions.every((category) => categoryOptions.includes(category))

      if (!isCategoryOption) return

      setSelectedCategories(categoryQueryOptions)
    }
  }, [router.isReady, router.query.categories, safeAppsList, selectedCategories.length, setSelectedCategories])

  const onSelectCategories = async (selectedCategories: string[]) => {
    const { categories: _, ...restProps } = router.query

    await router.push(
      {
        pathname: router.pathname,
        query:
          selectedCategories.length === 0 ? restProps : { ...router.query, categories: selectedCategories.join(',') },
      },
      undefined,
      {
        shallow: true,
      },
    )

    setSelectedCategories(selectedCategories)
  }

  return { onSelectCategories }
}

export default useCategoryFilter
