import { Box, Typography } from '@mui/material'
import useSafeInfo from '@/hooks/useSafeInfo'
import { sameAddress } from '@/utils/addresses'
import type { AllSafeItems } from '../../hooks/useAllSafesGrouped'
import { useMemo } from 'react'
import useAddressBook from '@/hooks/useAddressBook'
import SingleAccountItem from '../AccountItems/SingleAccountItem'

function CurrentSafeList({
  safeAddress,
  chainId,
  isReadOnly,
  onLinkClick,
}: {
  safeAddress: string
  chainId: string
  isReadOnly: boolean
  onLinkClick?: () => void
}) {
  const addressBook = useAddressBook()
  const safeName = addressBook[safeAddress]

  const safeItem = useMemo(
    () => ({
      chainId,
      address: safeAddress,
      isReadOnly,
      isPinned: false,
      lastVisited: -1,
      name: safeName,
    }),
    [chainId, safeAddress, isReadOnly, safeName],
  )

  return (
    <Box data-testid="current-safe-section" mb={3}>
      <Typography variant="h5" fontWeight={700} mb={2}>
        Current Safe Account
      </Typography>

      <SingleAccountItem onLinkClick={onLinkClick} safeItem={safeItem} />
    </Box>
  )
}

function CurrentSafe({ allSafes, onLinkClick }: { allSafes: AllSafeItems; onLinkClick?: () => void }) {
  const { safe, safeAddress } = useSafeInfo()

  const safeInList = useMemo(
    () => (safeAddress ? allSafes?.find((s) => sameAddress(s.address, safeAddress)) : undefined),
    [allSafes, safeAddress],
  )
  if (!safeAddress || safeInList?.isPinned) return null

  return (
    <CurrentSafeList
      onLinkClick={onLinkClick}
      safeAddress={safeAddress}
      chainId={safe.chainId}
      isReadOnly={!safeInList}
    />
  )
}

export default CurrentSafe
