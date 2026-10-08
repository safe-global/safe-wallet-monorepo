import Track from '@/components/common/Track'
import { NESTED_SAFE_EVENTS, NESTED_SAFE_LABELS } from '@/services/analytics/events/nested-safes'
import { useState, useMemo, type ReactElement } from 'react'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { useCurrentChain } from '@/hooks/useChains'
import { useLoadFeature } from '@/features/__core__'
import { type SafeItem } from '@/hooks/safes'
import { MyAccountsFeature, useSafeItemData } from '@/features/myAccounts'
import { useGetMultipleSafeOverviewsQuery } from '@/store/api/gateway'
import { useAppSelector } from '@/store'
import { selectCurrency } from '@/store/settingsSlice'
import useWallet from '@/hooks/wallets/useWallet'
import { skipToken } from '@reduxjs/toolkit/query'
import type { NestedSafeWithStatus } from '@/hooks/useNestedSafesVisibility'
import type { SafeOverview } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { SimilarityGroupContainer } from '@views/components/nested-safes/NestedSafesList/SimilarityGroupContainer'
import {
  NestedSafesListView,
  NestedSafeWarningIconView,
} from '@views/components/nested-safes/NestedSafesList/NestedSafesListView'

const MAX_NESTED_SAFES = 5

type SafeItemWithStatus = SafeItem & { isValid: boolean; isCurated: boolean }

function NestedSafeItem({
  safeItem,
  safeOverview,
  onClose,
  isManageMode,
  isSelected,
  onToggle,
  showWarning,
  showSimilarityWarning,
}: {
  safeItem: SafeItemWithStatus
  safeOverview?: SafeOverview
  onClose: () => void
  isManageMode: boolean
  isSelected: boolean
  onToggle: () => void
  showWarning: boolean
  showSimilarityWarning: boolean
}) {
  const {
    AccountItemButton,
    AccountItemLink,
    AccountItemCheckbox,
    AccountItemIcon,
    AccountItemInfo,
    AccountItemGroup,
    AccountItemBalance,
    $isReady,
  } = useLoadFeature(MyAccountsFeature)
  const { href, name, threshold, owners, elementRef, trackingLabel } = useSafeItemData(safeItem, { safeOverview })

  if (!$isReady) return null

  const warningIcon = showWarning ? <NestedSafeWarningIconView /> : null

  if (isManageMode) {
    return (
      <AccountItemButton onClick={onToggle} elementRef={elementRef}>
        <AccountItemCheckbox checked={isSelected} address={safeItem.address} onCheckedChange={onToggle} />
        <AccountItemIcon
          address={safeItem.address}
          threshold={threshold}
          owners={owners.length}
          chainId={safeItem.chainId}
        />
        <AccountItemInfo
          address={safeItem.address}
          name={name}
          chainId={safeItem.chainId}
          fullAddress
          showCopyButton
          highlight4bytes={showSimilarityWarning}
        />
        <AccountItemGroup>
          <AccountItemBalance fiatTotal={safeOverview?.fiatTotal} isLoading={!safeOverview} />
          {warningIcon}
        </AccountItemGroup>
      </AccountItemButton>
    )
  }

  return (
    <Track {...NESTED_SAFE_EVENTS.OPEN_NESTED_SAFE} label={NESTED_SAFE_LABELS.list}>
      <AccountItemLink href={href} onLinkClick={onClose} trackingLabel={trackingLabel} elementRef={elementRef}>
        <AccountItemIcon
          address={safeItem.address}
          threshold={threshold}
          owners={owners.length}
          chainId={safeItem.chainId}
        />
        <AccountItemInfo address={safeItem.address} name={name} chainId={safeItem.chainId} showCopyButton />
        <AccountItemBalance fiatTotal={safeOverview?.fiatTotal} isLoading={!safeOverview} />
      </AccountItemLink>
    </Track>
  )
}

interface GroupedSafes {
  groups: { key: string; safes: NestedSafeWithStatus[] }[]
  ungrouped: NestedSafeWithStatus[]
}

export function NestedSafesList({
  onClose,
  safesWithStatus,
  isManageMode = false,
  onToggleSafe,
  isSafeSelected,
  isFlagged,
  groupedSafes,
}: {
  onClose: () => void
  safesWithStatus: NestedSafeWithStatus[]
  isManageMode?: boolean
  onToggleSafe?: (address: string) => void
  isSafeSelected?: (address: string) => boolean
  isFlagged?: (address: string) => boolean
  groupedSafes?: GroupedSafes
}): ReactElement {
  const [showAll, setShowAll] = useState(false)
  const chain = useCurrentChain()
  const currency = useAppSelector(selectCurrency)
  const wallet = useWallet()

  // Helper to convert NestedSafeWithStatus to SafeItemWithStatus
  const toSafeItem = (safe: NestedSafeWithStatus): SafeItemWithStatus | null => {
    if (!chain) return null
    return {
      address: safe.address,
      chainId: chain.chainId,
      isReadOnly: false,
      isPinned: false,
      lastVisited: 0,
      name: undefined,
      isValid: safe.isValid,
      isCurated: safe.isCurated,
    }
  }

  const safeItems: SafeItemWithStatus[] = useMemo(() => {
    if (!chain) return []
    return safesWithStatus.map((safe) => ({
      address: safe.address,
      chainId: chain.chainId,
      isReadOnly: false,
      isPinned: false,
      lastVisited: 0,
      name: undefined,
      isValid: safe.isValid,
      isCurated: safe.isCurated,
    }))
  }, [safesWithStatus, chain])

  // In manage mode, always show all safes
  const nestedSafesToShow = showAll || isManageMode ? safeItems : safeItems.slice(0, MAX_NESTED_SAFES)

  // Helper to render a single safe item
  const renderSafeItem = (safeItem: SafeItemWithStatus) => {
    const safeOverview = safeOverviews?.find(
      (overview) => overview.chainId === safeItem.chainId && sameAddress(overview.address.value, safeItem.address),
    )
    const isSelected = isSafeSelected?.(safeItem.address) ?? false
    const showWarning = isManageMode && !safeItem.isValid
    const showSimilarityWarning = isManageMode && (isFlagged?.(safeItem.address) ?? false)

    return (
      <NestedSafeItem
        key={safeItem.address}
        safeItem={safeItem}
        safeOverview={safeOverview}
        onClose={onClose}
        isManageMode={isManageMode}
        isSelected={isSelected}
        onToggle={() => onToggleSafe?.(safeItem.address)}
        showWarning={showWarning}
        showSimilarityWarning={showSimilarityWarning}
      />
    )
  }

  const { data: safeOverviews } = useGetMultipleSafeOverviewsQuery(
    safeItems.length > 0 && chain
      ? {
          safes: safeItems,
          currency,
          walletAddress: wallet?.address,
        }
      : skipToken,
  )

  const onShowAll = () => {
    setShowAll(true)
  }

  // In manage mode with grouped safes, render groups first then ungrouped
  if (isManageMode && groupedSafes) {
    return (
      <NestedSafesListView>
        {groupedSafes.groups.map((group) => (
          <SimilarityGroupContainer key={group.key}>
            {group.safes.map((safe) => {
              const safeItem = toSafeItem(safe)
              return safeItem ? renderSafeItem(safeItem) : null
            })}
          </SimilarityGroupContainer>
        ))}

        {groupedSafes.ungrouped.map((safe) => {
          const safeItem = toSafeItem(safe)
          return safeItem ? renderSafeItem(safeItem) : null
        })}
      </NestedSafesListView>
    )
  }

  return (
    <NestedSafesListView
      showShowAll={safeItems.length > MAX_NESTED_SAFES && !showAll && !isManageMode}
      onShowAll={onShowAll}
    >
      {nestedSafesToShow.map((safeItem) => renderSafeItem(safeItem))}
    </NestedSafesListView>
  )
}
