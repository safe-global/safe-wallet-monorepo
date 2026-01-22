import { ChevronRight } from '@mui/icons-material'
import { List, Typography, Box, Checkbox, SvgIcon, Tooltip } from '@mui/material'

import Track from '@/components/common/Track'
import { NESTED_SAFE_EVENTS, NESTED_SAFE_LABELS } from '@/services/analytics/events/nested-safes'
import { useState, useMemo, type ReactElement } from 'react'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { useCurrentChain } from '@/hooks/useChains'
import SingleAccountItem from '@/features/myAccounts/components/AccountItems/SingleAccountItem'
import type { SafeItem } from '@/features/myAccounts/hooks/useAllSafes'
import { useGetMultipleSafeOverviewsQuery } from '@/store/api/gateway'
import { useAppSelector } from '@/store'
import { selectCurrency } from '@/store/settingsSlice'
import useWallet from '@/hooks/wallets/useWallet'
import { skipToken } from '@reduxjs/toolkit/query'
import type { NestedSafeWithStatus } from '@/hooks/useNestedSafesVisibility'
import WarningIcon from '@/public/images/notifications/warning.svg'

const MAX_NESTED_SAFES = 5

type SafeItemWithStatus = SafeItem & { isValid: boolean; isAutoHidden: boolean; isUserUnhidden: boolean }

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

  const handleCheckboxChange = (address: string) => () => {
    onToggleSafe?.(address)
  }

  const renderWarningIcon = () => (
    <Tooltip title="This Safe was not created by the parent Safe or its signers" placement="top">
      <SvgIcon
        component={WarningIcon}
        inheritViewBox
        fontSize="small"
        sx={{ color: 'warning.main', ml: 1, flexShrink: 0 }}
      />
    </Tooltip>
  )

  return (
    <List sx={{ gap: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch', p: 0 }}>
      {nestedSafesToShow.map((safeItem) => {
        const safeOverview = safeOverviews?.find(
          (overview) => overview.chainId === safeItem.chainId && sameAddress(overview.address.value, safeItem.address),
        )
        const isSelected = isSafeSelected?.(safeItem.address) ?? false

        // Show warning in manage mode for all invalid safes (regardless of selection)
        const showWarning = isManageMode && !safeItem.isValid

        return (
          <Box
            key={safeItem.address}
            sx={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {isManageMode && (
              <Checkbox
                checked={isSelected}
                onChange={handleCheckboxChange(safeItem.address)}
                size="small"
                sx={{ mr: 0.5 }}
                data-testid={`manage-nested-safe-checkbox-${safeItem.address}`}
              />
            )}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              {isManageMode ? (
                <SingleAccountItem
                  safeItem={safeItem}
                  safeOverview={safeOverview}
                  showActions={false}
                  showChainBadge={false}
                  suffixElement={showWarning ? renderWarningIcon() : undefined}
                />
              ) : (
                <Track {...NESTED_SAFE_EVENTS.OPEN_NESTED_SAFE} label={NESTED_SAFE_LABELS.list}>
                  <SingleAccountItem
                    onLinkClick={onClose}
                    safeItem={safeItem}
                    safeOverview={safeOverview}
                    showActions={false}
                    showChainBadge={false}
                  />
                </Track>
              )}
            </Box>
          </Box>
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
