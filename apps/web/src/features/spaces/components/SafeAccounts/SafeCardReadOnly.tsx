import { isMultiChainSafeItem, type SafeItem, type MultiChainSafeItem } from '@/hooks/safes'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { AccountItem } from '@/features/myAccounts'
import Identicon from '@/components/common/Identicon'
import NotActivatedBadge from '@/components/common/NotActivatedBadge'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { TriangleAlert, RotateCw } from 'lucide-react'
import { useMemo } from 'react'
import { Tooltip } from '@mui/material'
import FiatBalance from '../SelectSafesOnboarding/components/FiatBalance'
import ThresholdBadge from '../SelectSafesOnboarding/components/ThresholdBadge'
import useSafeCardData from '../SelectSafesOnboarding/hooks/useSafeCardData'
import { useLoadFeature } from '@/features/__core__'
import { SpacesFeature } from '../../SpacesFeature'
import { useGetMultipleSafeOverviewsQuery } from '@/store/api/gateway'
import { useRouter } from 'next/router'
import { AppRoutes } from '@/config/routes'
import { useChain } from '@/hooks/useChains'
import { useSafeDisplayName } from '@/hooks/useSafeDisplayName'
import useWallet from '@/hooks/wallets/useWallet'
import { useAppSelector } from '@/store'
import { selectCurrency } from '@/store/settingsSlice'
import { cn } from '@/utils/cn'
import CopyAddressIconButton from '@/components/common/CopyAddressIconButton'

interface SafeCardReadOnlyProps {
  safe: SafeItem | MultiChainSafeItem
  isSimilar?: boolean
  hideContextMenu?: boolean
  className?: string
  showPending?: boolean
  onClick?: () => void
  disabled?: boolean
  disabledTooltip?: string
}

const SafeCardReadOnly = ({
  safe,
  isSimilar,
  className,
  showPending = true,
  onClick,
  hideContextMenu = false,
  disabled = false,
  disabledTooltip,
}: SafeCardReadOnlyProps) => {
  const router = useRouter()
  const isMultiChain = isMultiChainSafeItem(safe)
  const { name, fiatValue, threshold, ownersCount, elementRef, isUndeployed, isActivating } = useSafeCardData(safe)
  const safes = useMemo<SafeItem[]>(
    () => (isMultiChain ? (safe as MultiChainSafeItem).safes : [safe as SafeItem]),
    [isMultiChain, safe],
  )
  const singleSafe = safes[0]
  const spaces = useLoadFeature(SpacesFeature)
  const chain = useChain(singleSafe?.chainId || '')
  const displayName = useSafeDisplayName(safe.address, singleSafe?.chainId || '', name)
  const currency = useAppSelector(selectCurrency)
  const { address: walletAddress } = useWallet() || {}

  // Fetch SafeOverviews for pending transaction info — aggregated across all chains for multi-chain items
  const {
    data: safeOverviews,
    isLoading: isLoadingOverview,
    isError: isOverviewError,
    error: overviewError,
    refetch: refetchOverview,
  } = useGetMultipleSafeOverviewsQuery({ currency, walletAddress, safes }, { skip: safes.length === 0 || !showPending })

  const queuedCount = useMemo(
    () => safeOverviews?.reduce((sum, overview) => sum + (overview.queued ?? 0), 0) ?? 0,
    [safeOverviews],
  )
  const hasQueuedItems = !isLoadingOverview && !isOverviewError && queuedCount > 0

  const isClickable = Boolean(singleSafe) && !disabled
  const tooltipTitle = disabled ? (disabledTooltip ?? '') : !singleSafe ? 'Safe data is not available' : ''

  const handleCardClick = () => {
    if (!singleSafe || !chain?.shortName) return

    router.push({
      pathname: AppRoutes.home,
      query: {
        safe: `${chain.shortName}:${singleSafe.address}`,
      },
    })
  }

  return (
    <Tooltip title={tooltipTitle} placement="top" arrow>
      <div
        ref={elementRef as React.Ref<HTMLDivElement>}
        data-testid="safe-list-item"
        onClick={isClickable ? onClick || handleCardClick : undefined}
        className={cn(
          'box-border flex w-full min-w-0 max-w-full items-center gap-1.5 rounded-3xl border-2 border-card bg-card py-4 pl-3 pr-3 transition-colors sm:gap-2 sm:pl-6 sm:pr-6',
          {
            'cursor-pointer hover:bg-muted/100': isClickable,
            'cursor-not-allowed opacity-60': !isClickable,
          },
          className,
        )}
      >
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-4">
          <span className="inline-flex shrink-0">
            <Identicon address={safe.address} />
          </span>

          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            {isSimilar && (
              <Badge variant="warning" className="self-start -ml-px">
                <TriangleAlert data-icon="inline-start" />
                High similarity
              </Badge>
            )}
            <div className="flex min-w-0 items-center gap-2">
              <span className="truncate text-base font-medium text-foreground">
                {displayName || shortenAddress(safe.address)}
              </span>
            </div>
            <div className="flex min-w-0 items-center gap-1.5">
              <span className="block min-w-0 break-all text-xs text-muted-foreground">
                {isSimilar ? (
                  <>
                    {safe.address.slice(0, 2)}
                    <b>{safe.address.slice(2, 6)}</b>
                    {safe.address.slice(6, -4)}
                    <b>{safe.address.slice(-4)}</b>
                  </>
                ) : (
                  shortenAddress(safe.address)
                )}
              </span>
              <CopyAddressIconButton address={safe.address} />
            </div>
          </div>
        </div>

        <div className="ml-auto flex shrink-0 items-center justify-end gap-1 pl-1 sm:pl-2">
          {isLoadingOverview ? (
            <div className="flex shrink-0 items-center gap-1 mr-8">
              <Skeleton className="h-6 w-20" />
            </div>
          ) : isOverviewError ? (
            <Tooltip
              title={`Failed to load transaction data. ${
                overviewError && 'status' in overviewError ? `Error: ${overviewError.status}` : 'Please try again.'
              }`}
              placement="top"
            >
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  refetchOverview()
                }}
                className="flex shrink-0 cursor-pointer items-center gap-1 mr-8 rounded px-1.5 py-0.5 text-destructive transition-colors hover:bg-destructive/10"
                type="button"
              >
                <TriangleAlert className="size-4" />
                <RotateCw className="size-3" />
                <span className="text-xs">Retry</span>
              </button>
            </Tooltip>
          ) : (
            showPending &&
            hasQueuedItems && (
              <div className="flex shrink-0 items-center gap-1 mr-8">
                <Badge variant="secondary" className="text-xs">
                  {queuedCount} pending
                </Badge>
              </div>
            )
          )}
          <AccountItem.ChainBadge safes={safes} className="justify-end" />
        </div>

        <div
          data-testid="balance-column"
          className="flex min-w-0 shrink-0 flex-col items-end gap-2 pl-1 sm:min-w-16 sm:pl-0"
        >
          {isUndeployed ? (
            <NotActivatedBadge isActivating={isActivating} data-testid="pending-activation-chip" />
          ) : (
            <FiatBalance value={fiatValue} />
          )}
          {threshold > 0 && <ThresholdBadge threshold={threshold} owners={ownersCount} />}
        </div>

        <div className="flex shrink-0 items-center gap-2 pl-2" onClick={(e) => e.stopPropagation()}>
          {spaces?.SpaceSafeContextMenu && !hideContextMenu && <spaces.SpaceSafeContextMenu safeItem={safe} />}
        </div>
      </div>
    </Tooltip>
  )
}

export default SafeCardReadOnly
