import { type ReactElement, useContext, useMemo, useCallback, useState, Suspense } from 'react'
import { useRouter } from 'next/router'
import dynamic from 'next/dynamic'
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
import {
  AccountHeaderView,
  ManageSafeButtonView,
} from '@views/features/safe-overview/components/AccountHeader/AccountHeaderView'

const QrModal = dynamic(() => import('@/components/common/QrCodeButton/QrModal'))

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

  return (
    <AccountHeaderView
      isLoading={isLoading}
      header={
        <DashboardHeader
          value={formattedValue}
          loading={!balancesLoaded}
          noAssets={noAssets}
          onSend={!noAssets && safe.deployed ? handleSend : undefined}
          onSwap={isSwapFeatureEnabled && !noAssets && safe.deployed ? handleSwap : undefined}
          onReceive={safe.deployed ? handleReceive : undefined}
          onBuildTransaction={safe.deployed ? handleBuildTransaction : undefined}
          otherActions={<ManageSafeButtonView onClick={handleManageSafe} />}
        />
      }
      qrModal={
        qrModalOpen && (
          <Suspense>
            <QrModal onClose={() => setQrModalOpen(false)} />
          </Suspense>
        )
      }
    />
  )
}

export default AccountHeader
