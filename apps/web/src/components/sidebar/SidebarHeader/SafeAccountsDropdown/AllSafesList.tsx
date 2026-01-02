import type { ReactElement } from 'react'
import { useMemo } from 'react'
import { Box, Typography } from '@mui/material'

import { useAllSafesGrouped } from '@/features/myAccounts/hooks/useAllSafesGrouped'
import { useAppSelector } from '@/store'
import { selectOrderByPreference } from '@/store/orderByPreferenceSlice'
import { getComparator } from '@/features/myAccounts/utils/utils'
import useSafeAddress from '@/hooks/useSafeAddress'
import useChainId from '@/hooks/useChainId'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { isMultiChainSafeItem } from '@/features/multichain/utils/utils'
import AccountListItem from './AccountListItem'
import MultiAccountListItem from './MultiAccountListItem'
import css from './styles.module.css'

type AllSafesListProps = {
  onSelect?: () => void
}

const AllSafesList = ({ onSelect }: AllSafesListProps): ReactElement => {
  const { allSingleSafes, allMultiChainSafes } = useAllSafesGrouped()
  const { orderBy } = useAppSelector(selectOrderByPreference)
  const safeAddress = useSafeAddress()
  const chainId = useChainId()

  const { currentSafe, otherSafes } = useMemo(() => {
    const allSafes = allSingleSafes && allMultiChainSafes ? [...allSingleSafes, ...allMultiChainSafes] : []

    // Find current safe and filter it out from the list
    let current = null
    const filteredSafes = allSafes.filter((safe) => {
      if (isMultiChainSafeItem(safe)) {
        // For multi-chain, check if any of the safes match current
        const hasCurrentSafe = safe.safes.some((s) => s.chainId === chainId && sameAddress(s.address, safeAddress))
        if (hasCurrentSafe) {
          current = safe
          return false // Exclude current safe from the list
        }
        return true
      } else {
        // For single safe
        const isCurrentSafe = safe.chainId === chainId && sameAddress(safe.address, safeAddress)
        if (isCurrentSafe) {
          current = safe
          return false // Exclude current safe from the list
        }
        return true
      }
    })

    // Sort by preference
    const comparator = getComparator(orderBy)
    const others = filteredSafes.sort(comparator)

    return {
      currentSafe: current,
      otherSafes: others,
    }
  }, [allSingleSafes, allMultiChainSafes, orderBy, safeAddress, chainId])

  if (otherSafes.length === 0 && !currentSafe) {
    return (
      <Box className={css.emptyState}>
        <Typography className={css.emptyStateTitle}>No Safes found</Typography>
        <Typography className={css.emptyStateMessage}>Connect your wallet or add a Safe to get started</Typography>
      </Box>
    )
  }

  return (
    <Box>
      {currentSafe && (
        <>
          <Typography className={css.sectionLabel}>Current</Typography>
          {isMultiChainSafeItem(currentSafe) ? (
            <MultiAccountListItem multiSafeItem={currentSafe} onSelect={onSelect} />
          ) : (
            <AccountListItem safeItem={currentSafe} onSelect={onSelect} />
          )}
        </>
      )}

      {otherSafes.length > 0 && (
        <>
          {currentSafe && <Typography className={css.sectionLabel}>All Accounts</Typography>}
          {otherSafes.map((safeItem) => {
            if (isMultiChainSafeItem(safeItem)) {
              return <MultiAccountListItem key={safeItem.address} multiSafeItem={safeItem} onSelect={onSelect} />
            }
            return (
              <AccountListItem
                key={`${safeItem.chainId}:${safeItem.address}`}
                safeItem={safeItem}
                onSelect={onSelect}
              />
            )
          })}
        </>
      )}
    </Box>
  )
}

export default AllSafesList
