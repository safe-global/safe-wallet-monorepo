import { ChevronRight } from '@mui/icons-material'
import { List, Typography, Box, SvgIcon, Tooltip } from '@mui/material'

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
import useSafeAddress from '@/hooks/useSafeAddress'
import { skipToken } from '@reduxjs/toolkit/query'
import type { NestedSafeItem } from '@/hooks/useFilteredNestedSafes'
import WarningIcon from '@/public/images/notifications/warning.svg'

const MAX_NESTED_SAFES = 5

export function NestedSafesList({
  onClose,
  nestedSafes,
}: {
  onClose: () => void
  nestedSafes: Array<NestedSafeItem>
}): ReactElement {
  const [showAll, setShowAll] = useState(false)
  const chain = useCurrentChain()
  const currency = useAppSelector(selectCurrency)
  const parentSafeAddress = useSafeAddress()

  const safeItems: (SafeItem & { isValid: boolean })[] = useMemo(() => {
    if (!chain) return []
    return nestedSafes.map(({ address, isValid }) => ({
      address,
      chainId: chain.chainId,
      isReadOnly: false,
      isPinned: false,
      lastVisited: 0,
      name: undefined,
      isValid,
    }))
  }, [nestedSafes, chain])

  const validSafes = useMemo(() => safeItems.filter((item) => item.isValid), [safeItems])
  const invalidSafes = useMemo(() => safeItems.filter((item) => !item.isValid), [safeItems])

  // Always show first N valid safes
  const initialSafes = validSafes.slice(0, MAX_NESTED_SAFES)

  // Hidden safes: remaining valid safes + all invalid safes
  const hiddenSafes = [...validSafes.slice(MAX_NESTED_SAFES), ...invalidSafes]

  // Show accordion if there are hidden safes
  const hasMoreToShow = hiddenSafes.length > 0

  // Use parent Safe address as walletAddress since the parent Safe is the owner of nested Safes
  const { data: safeOverviews } = useGetMultipleSafeOverviewsQuery(
    safeItems.length > 0 && chain
      ? {
          safes: safeItems,
          currency,
          walletAddress: parentSafeAddress,
        }
      : skipToken,
  )

  const renderSafeItem = (safeItem: (typeof safeItems)[0]) => {
    const safeOverview = safeOverviews?.find(
      (overview) => overview.chainId === safeItem.chainId && sameAddress(overview.address.value, safeItem.address),
    )
    return (
      <Box
        key={safeItem.address}
        sx={{
          width: '100%',
          opacity: safeItem.isValid ? 1 : 0.5,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        {!safeItem.isValid && (
          <Tooltip title="This Safe was not created by the parent Safe or its signers" placement="top">
            <SvgIcon
              component={WarningIcon}
              inheritViewBox
              fontSize="small"
              sx={{ color: 'warning.main', flexShrink: 0 }}
            />
          </Tooltip>
        )}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Track {...NESTED_SAFE_EVENTS.OPEN_NESTED_SAFE} label={NESTED_SAFE_LABELS.list}>
            <SingleAccountItem
              onLinkClick={onClose}
              safeItem={safeItem}
              safeOverview={safeOverview}
              showActions={false}
              showChainBadge={false}
              hidePendingTxs={!safeItem.isValid}
            />
          </Track>
        </Box>
      </Box>
    )
  }

  return (
    <List sx={{ gap: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch', p: 0 }}>
      {/* Always show initial valid safes */}
      {initialSafes.map(renderSafeItem)}

      {/* Accordion header */}
      {hasMoreToShow && (
        <Track {...NESTED_SAFE_EVENTS.SHOW_ALL}>
          <Typography
            variant="caption"
            color="text.secondary"
            textTransform="uppercase"
            fontWeight={700}
            sx={{ cursor: 'pointer', textAlign: 'center', py: 1 }}
            onClick={() => setShowAll((prev) => !prev)}
          >
            {showAll ? 'Show less' : 'Show all Nested Safes'}
            <ChevronRight
              color="border"
              sx={{ transform: showAll ? 'rotate(-90deg)' : 'rotate(90deg)', ml: 1 }}
              fontSize="inherit"
            />
          </Typography>
        </Track>
      )}

      {/* Hidden safes shown when expanded */}
      {showAll && hiddenSafes.map(renderSafeItem)}
    </List>
  )
}
