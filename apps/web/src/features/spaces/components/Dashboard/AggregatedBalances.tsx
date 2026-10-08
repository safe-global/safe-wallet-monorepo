import { useRouter } from 'next/router'
import { useContext, useCallback, useState } from 'react'
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
import { DashboardHeader } from './DashboardHeader'
import QrModal from '@/components/common/QrCodeButton/QrModal'
import { useUrlSpaceId, withSpaceId } from '@/hooks/useUrlSpaceId'
import {
  AggregatedBalancesView,
  AggregatedBalanceSkeletonView,
} from '@views/features/spaces/components/Dashboard/AggregatedBalancesView'

const AggregatedBalance = ({
  safeItems,
  accountsLoading = false,
}: {
  safeItems: SafeItem[]
  accountsLoading?: boolean
}) => {
  const currency = useAppSelector(selectCurrency)
  const router = useRouter()
  const spaceId = useUrlSpaceId()
  const { link: txBuilderLink } = useTxBuilderApp()
  const { setTxFlow } = useContext(TxModalContext)
  const firstSafe = safeItems[0]
  const chain = useChain(firstSafe?.chainId ?? '')
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false)

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

  if (isLoading) return <AggregatedBalanceSkeletonView />

  const isDimmed = safeItems.length === 0 || accountsLoading
  const formattedValue = formatCurrencyPrecise(aggregatedBalance, currency)

  const handleSend = async () => {
    await setActiveSafe()
    setTxFlow(<TokenTransferFlow />, resetActiveSafe, false)
  }

  const handleSwap = () => {
    if (!safeQueryParam) return
    router.push({ pathname: AppRoutes.swap, query: withSpaceId({ safe: safeQueryParam }, spaceId) })
  }

  const handleBuildTransaction = () => {
    if (!safeQueryParam) return
    const query = typeof txBuilderLink.query === 'object' ? txBuilderLink.query : {}
    router.push({ ...txBuilderLink, query: { ...query, safe: safeQueryParam } })
  }

  const handleReceive = async () => {
    if (!safeQueryParam) return
    await setActiveSafe()
    setIsReceiveModalOpen(true)
  }

  const handleReceiveClose = async () => {
    setIsReceiveModalOpen(false)
    await resetActiveSafe()
  }

  return (
    <AggregatedBalancesView
      isDimmed={isDimmed}
      renderHeader={({ otherActions }) => (
        <DashboardHeader
          value={formattedValue}
          noAssets={isDimmed}
          onSend={handleSend}
          onReceive={handleReceive}
          onSwap={handleSwap}
          onBuildTransaction={handleBuildTransaction}
          otherActions={otherActions}
        />
      )}
      receiveModal={isReceiveModalOpen && <QrModal onClose={handleReceiveClose} />}
    />
  )
}

export default AggregatedBalance
