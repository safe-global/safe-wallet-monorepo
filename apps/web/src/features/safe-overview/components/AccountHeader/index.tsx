import { type ReactElement, useContext, useMemo, useCallback, useState, Suspense } from 'react'
import { useRouter } from 'next/router'
import dynamic from 'next/dynamic'
import { Settings } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { DashboardHeader } from '@/features/spaces'
import { TxModalContext } from '@/components/tx-flow'
import { TokenTransferFlow } from '@/components/tx-flow/flows'
import { OVERVIEW_EVENTS, trackEvent } from '@/services/analytics'
import { SWAP_EVENTS, SWAP_LABELS } from '@/services/analytics/events/swaps'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useVisibleBalances } from '@/hooks/useVisibleBalances'
import { AppRoutes } from '@/config/routes'
import { useIsSwapFeatureEnabled } from '@/features/swap'
import { useTxBuilderApp } from '@/hooks/safe-apps/useTxBuilderApp'
import { formatCurrencyPrecise } from '@safe-global/utils/utils/formatNumber'
import { useAppSelector } from '@/store'
import { selectCurrency } from '@/store/settingsSlice'

const QrModal = dynamic(() => import('@/components/sidebar/QrCodeButton/QrModal'))

const AccountHeader = (): ReactElement => {
  const { safe, safeLoading, safeLoaded } = useSafeInfo()
  const { balances, loaded: balancesLoaded, loading: balancesLoading } = useVisibleBalances()
  const { setTxFlow } = useContext(TxModalContext)
  const router = useRouter()
  const currency = useAppSelector(selectCurrency)
  const isSwapFeatureEnabled = useIsSwapFeatureEnabled()
  const { link: txBuilderLink } = useTxBuilderApp()
  const [qrModalOpen, setQrModalOpen] = useState(false)

  const isInitialState = !safeLoaded && !safeLoading
  const isLoading = safeLoading || balancesLoading || isInitialState

  const items = useMemo(() => {
    return balances.items.filter((item) => item.balance !== '0')
  }, [balances.items])

  const noAssets = balancesLoaded && items.length === 0

  const formattedValue = formatCurrencyPrecise(Number(balances.fiatTotal), currency)

  const handleSend = useCallback(() => {
    setTxFlow(<TokenTransferFlow />, undefined, false)
    trackEvent(OVERVIEW_EVENTS.NEW_TRANSACTION)
  }, [setTxFlow])

  const handleSwap = useCallback(() => {
    trackEvent({ ...SWAP_EVENTS.OPEN_SWAPS, label: SWAP_LABELS.dashboard })
    router.push({ pathname: AppRoutes.swap, query: router.query })
  }, [router])

  const handleReceive = useCallback(() => {
    trackEvent(OVERVIEW_EVENTS.SHOW_QR)
    setQrModalOpen(true)
  }, [])

  const handleBuildTransaction = useCallback(() => {
    const query = typeof txBuilderLink.query === 'object' ? txBuilderLink.query : {}
    router.push({ ...txBuilderLink, query: { ...query, ...router.query } })
  }, [router, txBuilderLink])

  const handleManageSafe = useCallback(() => {
    router.push({ pathname: AppRoutes.settings.setup, query: router.query })
  }, [router])

  if (isLoading) return <SafeAccountHeaderSkeleton />

  return (
    <>
      <DashboardHeader
        value={formattedValue}
        loading={!balancesLoaded}
        noAssets={noAssets}
        onSend={!noAssets && safe.deployed ? handleSend : undefined}
        onSwap={isSwapFeatureEnabled && !noAssets && safe.deployed ? handleSwap : undefined}
        onReceive={safe.deployed ? handleReceive : undefined}
        onBuildTransaction={safe.deployed ? handleBuildTransaction : undefined}
        otherActions={
          <Button
            variant="outline"
            className="!border-[var(--color-border-light)] bg-transparent hover:bg-muted/50"
            onClick={handleManageSafe}
          >
            <Settings className="size-4" />
            Manage Safe
          </Button>
        }
      />

      {qrModalOpen && (
        <Suspense>
          <QrModal onClose={() => setQrModalOpen(false)} />
        </Suspense>
      )}
    </>
  )
}

const SafeAccountHeaderSkeleton = (): ReactElement => {
  return (
    <div className="mb-10 flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <Skeleton className="h-[16px] w-[80px]" />
        <Skeleton className="h-[30px] w-[200px]" />
      </div>
      <Skeleton className="h-[36px] w-[500px]" />
    </div>
  )
}

export default AccountHeader
