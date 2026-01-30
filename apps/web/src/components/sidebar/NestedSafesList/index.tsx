import { ChevronRight } from '@mui/icons-material'
import { List, Typography, SvgIcon, Tooltip } from '@mui/material'

import Track from '@/components/common/Track'
import { NESTED_SAFE_EVENTS, NESTED_SAFE_LABELS } from '@/services/analytics/events/nested-safes'
import { useState, useMemo, type ReactElement } from 'react'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { useCurrentChain } from '@/hooks/useChains'
import { AccountItem } from '@/features/myAccounts/components/AccountItem'
import { useSafeItemData } from '@/features/myAccounts/hooks/useSafeItemData'
import type { SafeItem } from '@/features/myAccounts/hooks/useAllSafes'
import { useGetMultipleSafeOverviewsQuery } from '@/store/api/gateway'
import { useAppSelector } from '@/store'
import { selectCurrency } from '@/store/settingsSlice'
import useWallet from '@/hooks/wallets/useWallet'
import { skipToken } from '@reduxjs/toolkit/query'
import type { NestedSafeWithStatus } from '@/hooks/useNestedSafesVisibility'
import type { SafeOverview } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import WarningIcon from '@/public/images/notifications/warning.svg'

const MAX_NESTED_SAFES = 5

type SafeItemWithStatus = SafeItem & { isValid: boolean; isAutoHidden: boolean; isUserUnhidden: boolean }

function NestedSafeItem({
  safeItem,
  safeOverview,
  onClose,
  isManageMode,
  isSelected,
  onToggle,
  showWarning,
}: {
  safeItem: SafeItemWithStatus
  safeOverview?: SafeOverview
  onClose: () => void
  isManageMode: boolean
  isSelected: boolean
  onToggle: () => void
  showWarning: boolean
}) {
  const { href, name, threshold, owners, elementRef, trackingLabel } = useSafeItemData(safeItem, { safeOverview })

  const warningIcon = showWarning ? (
    <Tooltip title="This Safe was not created by the parent Safe or its signers" placement="top">
      <SvgIcon
        component={WarningIcon}
        inheritViewBox
        fontSize="small"
        sx={{ color: 'warning.main', ml: 1, flexShrink: 0 }}
        data-testid="suspicious-safe-warning"
      />
    </Tooltip>
  ) : null

  if (isManageMode) {
    return (
      <AccountItem.Button onClick={onToggle} elementRef={elementRef}>
        <AccountItem.Checkbox checked={isSelected} address={safeItem.address} />
        <AccountItem.Icon
          address={safeItem.address}
          threshold={threshold}
          owners={owners.length}
          chainId={safeItem.chainId}
        />
        <AccountItem.Info address={safeItem.address} name={name} chainId={safeItem.chainId} />
        <AccountItem.Group>
          <AccountItem.Balance fiatTotal={safeOverview?.fiatTotal} isLoading={!safeOverview} />
          {warningIcon}
        </AccountItem.Group>
      </AccountItem.Button>
    )
  }

  return (
    <Track {...NESTED_SAFE_EVENTS.OPEN_NESTED_SAFE} label={NESTED_SAFE_LABELS.list}>
      <AccountItem.Link href={href} onLinkClick={onClose} trackingLabel={trackingLabel} elementRef={elementRef}>
        <AccountItem.Icon
          address={safeItem.address}
          threshold={threshold}
          owners={owners.length}
          chainId={safeItem.chainId}
        />
        <AccountItem.Info address={safeItem.address} name={name} chainId={safeItem.chainId} />
        <AccountItem.Balance fiatTotal={safeOverview?.fiatTotal} isLoading={!safeOverview} />
      </AccountItem.Link>
    </Track>
  )
}

export function NestedSafesList({
  onClose,
  safesWithStatus,
  isManageMode = false,
  onToggleSafe,
  isSafeSelected,
}: {
  onClose: () => void
  safesWithStatus: NestedSafeWithStatus[]
  isManageMode?: boolean
  onToggleSafe?: (address: string) => void
  isSafeSelected?: (address: string) => boolean
}): ReactElement {
  const [showAll, setShowAll] = useState(false)
  const chain = useCurrentChain()
  const currency = useAppSelector(selectCurrency)
  const wallet = useWallet()

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
      isAutoHidden: safe.isAutoHidden,
      isUserUnhidden: safe.isUserUnhidden,
    }))
  }, [safesWithStatus, chain])

  // In manage mode, always show all safes
  const nestedSafesToShow = showAll || isManageMode ? safeItems : safeItems.slice(0, MAX_NESTED_SAFES)

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

  return (
    <List sx={{ gap: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch', p: 0 }}>
      {nestedSafesToShow.map((safeItem) => {
        const safeOverview = safeOverviews?.find(
          (overview) => overview.chainId === safeItem.chainId && sameAddress(overview.address.value, safeItem.address),
        )
        const isSelected = isSafeSelected?.(safeItem.address) ?? false
        const showWarning = isManageMode && !safeItem.isValid

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
          />
        )
      })}
      {safeItems.length > MAX_NESTED_SAFES && !showAll && !isManageMode && (
        <Track {...NESTED_SAFE_EVENTS.SHOW_ALL}>
          <Typography
            variant="caption"
            color="text.secondary"
            textTransform="uppercase"
            fontWeight={700}
            sx={{ cursor: 'pointer', textAlign: 'center', py: 1 }}
            onClick={onShowAll}
          >
            Show all Nested Safes
            <ChevronRight color="border" sx={{ transform: 'rotate(90deg)', ml: 1 }} fontSize="inherit" />
          </Typography>
        </Track>
      )}
    </List>
  )
}
