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
  onLinkClick,
}: {
  safeAddress: string
  chainId: string
  onLinkClick?: () => void
}) {
  const addressBook = useAddressBook()
  const safeName = addressBook[safeAddress]

  const safeItem = useMemo(
    () => ({
      chainId,
      address: safeAddress,
      isReadOnly: true,
      isPinned: false,
      lastVisited: -1,
      name: safeName,
    }),
    [chainId, safeAddress, safeName],
  )

  return <SingleAccountItem onLinkClick={onLinkClick} safeItem={safeItem} />
}

function CurrentSafe({ allSafes, onLinkClick }: { allSafes: AllSafeItems; onLinkClick?: () => void }) {
  const { safe, safeAddress } = useSafeInfo()

  const isPinned = useMemo(
    () => safeAddress && allSafes?.some((s) => s.isPinned && sameAddress(s.address, safeAddress)),
    [allSafes, safeAddress],
  )
  if (!safeAddress || isPinned) return null

  return (
    <Box mb={3}>
      <Typography variant="h5" fontWeight={700} mb={2}>
        Current Safe Account
      </Typography>

      <CurrentSafeList onLinkClick={onLinkClick} safeAddress={safeAddress} chainId={safe.chainId} />
    </Box>
  )
}

export default CurrentSafe
