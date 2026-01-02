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
import SingleAccountItem from '@/features/myAccounts/components/AccountItems/SingleAccountItem'
import MultiAccountItem from '@/features/myAccounts/components/AccountItems/MultiAccountItem'
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

    let current = null
    const filteredSafes = allSafes.filter((safe) => {
      if (isMultiChainSafeItem(safe)) {
        const hasCurrentSafe = safe.safes.some((s) => s.chainId === chainId && sameAddress(s.address, safeAddress))
        if (hasCurrentSafe) {
          current = safe
          return false
        }
        return true
      } else {
        const isCurrentSafe = safe.chainId === chainId && sameAddress(safe.address, safeAddress)
        if (isCurrentSafe) {
          current = safe
          return false
        }
        return true
      }
    })

    const comparator = getComparator(orderBy)
    const others = filteredSafes.sort(comparator)

    return { currentSafe: current, otherSafes: others }
  }, [allSingleSafes, allMultiChainSafes, orderBy, safeAddress, chainId])

  if (otherSafes.length === 0 && !currentSafe) {
    return (
      <Box className={css.emptyState}>
        <Typography className={css.emptyStateTitle}>No Safes found</Typography>
        <Typography className={css.emptyStateMessage}>Connect a wallet or add a Safe to get started</Typography>
      </Box>
    )
  }

  return (
    <Box>
      {currentSafe &&
        (isMultiChainSafeItem(currentSafe) ? (
          <MultiAccountItem multiSafeAccountItem={currentSafe} onLinkClick={onSelect} />
        ) : (
          <SingleAccountItem safeItem={currentSafe} onLinkClick={onSelect} />
        ))}

      {otherSafes.map((safeItem) => {
        if (isMultiChainSafeItem(safeItem)) {
          return <MultiAccountItem key={safeItem.address} multiSafeAccountItem={safeItem} onLinkClick={onSelect} />
        }
        return (
          <SingleAccountItem
            key={`${safeItem.chainId}:${safeItem.address}`}
            safeItem={safeItem}
            onLinkClick={onSelect}
          />
        )
      })}
    </Box>
  )
}

export default AllSafesList
