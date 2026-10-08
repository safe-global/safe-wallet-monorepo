import { isMultiChainSafeItem, type SafeItem, type MultiChainSafeItem } from '@/hooks/safes'
import { AccountItem } from '@/features/myAccounts'
import { useMemo, type ReactNode, type Ref } from 'react'
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
import { useUrlSpaceId, withSpaceId } from '@/hooks/useUrlSpaceId'
import { SafeCardReadOnlyView } from '@views/features/spaces/components/SafeAccounts/SafeCardReadOnlyView'

interface SafeCardReadOnlyProps {
  safe: SafeItem | MultiChainSafeItem
  isSimilar?: boolean
  hideContextMenu?: boolean
  className?: string
  showPending?: boolean
  onClick?: () => void
  disabled?: boolean
  disabledTooltip?: string
  /** Optional trailing action (e.g. "Add to workspace") rendered before the context menu. */
  action?: ReactNode
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
  action,
}: SafeCardReadOnlyProps) => {
  const router = useRouter()
  const spaceId = useUrlSpaceId()
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

  const handleCardClick = () => {
    if (!singleSafe || !chain?.shortName) return

    router.push({
      pathname: AppRoutes.home,
      query: withSpaceId({ safe: `${chain.shortName}:${singleSafe.address}` }, spaceId),
    })
  }

  return (
    <SafeCardReadOnlyView
      address={safe.address}
      displayName={displayName}
      isSimilar={isSimilar}
      cardClassName={className}
      cardRef={elementRef as Ref<HTMLDivElement>}
      isClickable={isClickable}
      onClick={isClickable ? onClick || handleCardClick : undefined}
      isMissingSafeData={!singleSafe}
      disabled={disabled}
      disabledTooltip={disabledTooltip}
      showPending={showPending}
      isLoadingOverview={isLoadingOverview}
      isOverviewError={isOverviewError}
      overviewErrorStatus={overviewError && 'status' in overviewError ? overviewError.status : undefined}
      onRetryOverview={refetchOverview}
      queuedCount={queuedCount}
      hasQueuedItems={hasQueuedItems}
      renderChainBadge={(badgeProps) => <AccountItem.ChainBadge safes={safes} {...badgeProps} />}
      isUndeployed={isUndeployed}
      statusChip={<AccountItem.StatusChip undeployedSafe isActivating={isActivating} />}
      fiatValue={fiatValue}
      threshold={threshold}
      ownersCount={ownersCount}
      action={action}
      contextMenu={spaces?.SpaceSafeContextMenu && !hideContextMenu && <spaces.SpaceSafeContextMenu safeItem={safe} />}
    />
  )
}

export default SafeCardReadOnly
