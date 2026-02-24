import { Skeleton } from '@mui/material'
import { useRouter } from 'next/router'
import { useContext, useCallback } from 'react'
import { useAppSelector } from '@/store'
import { selectCurrency } from '@/store/settingsSlice'
import { useGetMultipleSafeOverviewsQuery } from '@/store/api/gateway'
import type { SafeItem } from '@/hooks/safes'
import { useChain } from '@/hooks/useChains'
import { formatCurrencyPrecise } from '@safe-global/utils/utils/formatNumber'
import { AppRoutes } from '@/config/routes'
import { useTxBuilderApp } from '@/hooks/safe-apps/useTxBuilderApp'
import { TxModalContext } from '@/components/tx-flow'
import { TokenTransferFlow } from '@/components/tx-flow/flows'
import { MoreVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DashboardHeader } from '@/features/spaces/components/Dashboard/DashboardHeader'

const AggregatedBalance = ({ safeItems }: { safeItems: SafeItem[] }) => {
  const currency = useAppSelector(selectCurrency)
  const router = useRouter()
  const { link: txBuilderLink } = useTxBuilderApp()
  const { setTxFlow } = useContext(TxModalContext)
  const firstSafe = safeItems[0]
  const chain = useChain(firstSafe?.chainId ?? '')

  const { data: safeOverviews, isLoading } = useGetMultipleSafeOverviewsQuery({ safes: safeItems, currency })
  const aggregatedBalance = safeOverviews ? safeOverviews.reduce((prev, next) => prev + Number(next.fiatTotal), 0) : 0

  const safeQueryParam = chain && firstSafe ? `${chain.shortName}:${firstSafe.address}` : undefined

  const setActiveSafe = useCallback(async () => {
    if (!safeQueryParam) return
    await router.replace({
      pathname: router.pathname,
      query: { ...router.query, safe: safeQueryParam, chain: chain?.shortName },
    })
  }, [router, safeQueryParam, chain?.shortName])

  const resetActiveSafe = useCallback(async () => {
    await router.replace({
      pathname: router.pathname,
      query: { ...router.query, safe: undefined, chain: undefined },
    })
  }, [router])

  if (isLoading) return <AggregatedBalanceSkeleton />

  const formattedValue = formatCurrencyPrecise(aggregatedBalance, currency)

  const handleSend = async () => {
    await setActiveSafe()
    setTxFlow(<TokenTransferFlow />, resetActiveSafe, false)
  }

  const handleSwap = () => {
    if (!safeQueryParam) return
    router.push({ pathname: AppRoutes.swap, query: { safe: safeQueryParam } })
  }

  const handleBuildTransaction = () => {
    if (!safeQueryParam) return
    const query = typeof txBuilderLink.query === 'object' ? txBuilderLink.query : {}
    router.push({ ...txBuilderLink, query: { ...query, safe: safeQueryParam } })
  }

  return (
    <DashboardHeader
      value={formattedValue}
      onSend={handleSend}
      onSwap={handleSwap}
      onBuildTransaction={handleBuildTransaction}
      otherActions={
        <Button variant="ghost" size="sm" className="text-muted-foreground">
          <MoreVertical className="size-4 text-foreground" />
          Customize
        </Button>
      }
    />
  )
}

const AggregatedBalanceSkeleton = () => {
  return (
    <div className="mb-4 flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <Skeleton variant="rounded" width={80} height={16} />
        <Skeleton variant="rounded" width={200} height={30} />
      </div>
      <Skeleton variant="rounded" width={400} height={36} />
    </div>
  )
}

export default AggregatedBalance
