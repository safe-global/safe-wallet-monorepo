import { type ReactElement, useMemo } from 'react'
import { useRouter } from 'next/router'
import useBalances from '@/hooks/useBalances'
import { useVisibleAssets } from '@/components/balances/AssetsTable/useHideAssets'
import { useAppSelector } from '@/store'
import { selectCurrency } from '@/store/settingsSlice'
import { AppRoutes } from '@/config/routes'
import { useSafeLinkQuery } from '@/hooks/useSafeLinkQuery'
import { AssetsListView } from '@views/features/assets/components/AssetsList/AssetsListView'

const MAX_ASSETS = 3

const AssetsList = (): ReactElement => {
  const router = useRouter()
  const safeLinkQuery = useSafeLinkQuery()
  const { loading, balances } = useBalances()
  const visibleAssets = useVisibleAssets()
  const currency = useAppSelector(selectCurrency)

  const items = useMemo(() => {
    return visibleAssets.filter((item) => item.balance !== '0').slice(0, MAX_ASSETS)
  }, [visibleAssets])

  const remainingCount = useMemo(() => {
    const total = visibleAssets.filter((item) => item.balance !== '0').length
    return total > MAX_ASSETS ? total - MAX_ASSETS : undefined
  }, [visibleAssets])

  const isLoading = loading || !balances.fiatTotal

  const handleViewAll = () => {
    router.push({ pathname: AppRoutes.balances.index, query: safeLinkQuery })
  }

  return (
    <AssetsListView
      isLoading={isLoading}
      items={items}
      remainingCount={remainingCount}
      currency={currency}
      skeletonCount={MAX_ASSETS}
      onViewAll={handleViewAll}
    />
  )
}

export default AssetsList
