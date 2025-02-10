import { Box, Typography } from '@mui/material'
import useSafeInfo from '@/hooks/useSafeInfo'
import { sameAddress } from '@/utils/addresses'
import type { AllSafeItems } from '../../hooks/useAllSafesGrouped'
import { useMemo } from 'react'
import useAddressBook from '@/hooks/useAddressBook'
import SafesList from '../SafesList'
import type { SafeInfo } from '@safe-global/safe-gateway-typescript-sdk'

function CurrentSafeList({ safe, onLinkClick }: { safe: SafeInfo; onLinkClick?: () => void }) {
  const {
    chainId,
    address: { value: safeAddress },
  } = safe
  const addressBook = useAddressBook()
  const safeName = addressBook[safeAddress]

  const safeItems = useMemo(
    () => [
      {
        chainId,
        address: safeAddress,
        isReadOnly: true,
        isPinned: false,
        lastVisited: -1,
        name: safeName,
      },
    ],
    [chainId, safeAddress, safeName],
  )

  return <SafesList safes={safeItems} onLinkClick={onLinkClick} />
}

function CurrentSafe({ allSafes, onLinkClick }: { allSafes: AllSafeItems; onLinkClick?: () => void }) {
  const { safe, safeAddress } = useSafeInfo()
  const isPinned = useMemo(
    () => safeAddress && allSafes?.some((s) => s.isPinned && sameAddress(s.address, safeAddress)),
    [allSafes, safeAddress],
  )
  if (!safeAddress || isPinned) return null

  return (
    <Box mb={2}>
      <Typography variant="h5" fontWeight={700} mb={2}>
        Current Safe Account
      </Typography>

      <CurrentSafeList onLinkClick={onLinkClick} safe={safe} />
    </Box>
  )
}

export default CurrentSafe
