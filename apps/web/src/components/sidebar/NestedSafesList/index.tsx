import { ChevronRight } from '@mui/icons-material'
import { List, Typography, Box } from '@mui/material'

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

const MAX_NESTED_SAFES = 5

export function NestedSafesList({
  onClose,
  nestedSafes,
}: {
  onClose: () => void
  nestedSafes: Array<string>
}): ReactElement {
  const [showAll, setShowAll] = useState(false)
  const chain = useCurrentChain()
  const currency = useAppSelector(selectCurrency)
  const wallet = useWallet()

  const safeItems: SafeItem[] = useMemo(() => {
    if (!chain) return []
    return nestedSafes.map((address) => ({
      address,
      chainId: chain.chainId,
      isReadOnly: false,
      isPinned: false,
      lastVisited: 0,
      name: undefined,
    }))
  }, [nestedSafes, chain])

  const nestedSafesToShow = showAll ? safeItems : safeItems.slice(0, MAX_NESTED_SAFES)

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
        return (
          <Box key={safeItem.address} sx={{ width: '100%' }}>
            <Track {...NESTED_SAFE_EVENTS.OPEN_NESTED_SAFE} label={NESTED_SAFE_LABELS.list}>
              <SingleAccountItem
                onLinkClick={onClose}
                safeItem={safeItem}
                safeOverview={safeOverview}
                showActions={false}
                showChainBadge={false}
              />
            </Track>
          </Box>
        )
      })}
      {safeItems.length > MAX_NESTED_SAFES && !showAll && (
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
