import { Box, Typography } from '@mui/material'
import useSafeInfo from '@/hooks/useSafeInfo'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import type { AllSafeItems } from '@/hooks/safes'
import { useMemo } from 'react'
import useAddressBook from '@/hooks/useAddressBook'
import { SafeListItem } from '../SafesList/SafeListItem'

function CurrentSafe({ allSafes, onLinkClick }: { allSafes: AllSafeItems; onLinkClick?: () => void }) {
  const { safe, safeAddress } = useSafeInfo()
  const addressBook = useAddressBook()

  const safeInList = useMemo(
    () => (safeAddress ? allSafes?.find((s) => sameAddress(s.address, safeAddress)) : undefined),
    [allSafes, safeAddress],
  )

  const safeItem = useMemo(
    () => ({
      chainId: safe.chainId,
      address: safeAddress,
      isReadOnly: !safeInList,
      isPinned: false,
      lastVisited: -1,
      name: addressBook[safeAddress],
    }),
    [safe.chainId, safeAddress, safeInList, addressBook],
  )

  if (!safeAddress || safeInList?.isPinned) return null

  return (
    <Box data-testid="current-safe-section" mb={3}>
      <Typography variant="h5" fontWeight={700} mb={2}>
        Current Safe Account
      </Typography>
      <SafeListItem safeItem={safeItem} onLinkClick={onLinkClick} />
    </Box>
  )
}

export default CurrentSafe
