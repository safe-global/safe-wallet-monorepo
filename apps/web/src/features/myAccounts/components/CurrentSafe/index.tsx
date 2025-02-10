import { Box, Typography } from '@mui/material'
import useSafeInfo from '@/hooks/useSafeInfo'
import { sameAddress } from '@/utils/addresses'
import { AllSafeItems } from '../../hooks/useAllSafesGrouped'
import { useMemo } from 'react'
import useAddressBook from '@/hooks/useAddressBook'
import SafesList from '../SafesList'
import css from '@/features/myAccounts/styles.module.css'

function CurrentSafeList({ onLinkClick }: { onLinkClick?: () => void }) {
  const { safe, safeAddress } = useSafeInfo()
  const addressBook = useAddressBook()
  const safeName = addressBook[safeAddress]

  const safeItems = useMemo(
    () => [
      {
        chainId: safe.chainId,
        address: safeAddress,
        isReadOnly: true,
        isPinned: false,
        lastVisited: -1,
        name: addressBook[safeAddress],
      },
    ],
    [safe.chainId, safeAddress, safeName],
  )

  return <SafesList safes={safeItems} onLinkClick={onLinkClick} />
}

function CurrentSafe({ allSafes, onLinkClick }: { allSafes: AllSafeItems; onLinkClick?: () => void }) {
  const { safeAddress } = useSafeInfo()
  const isInList = safeAddress && allSafes.some((s) => sameAddress(s.address, safeAddress))
  if (!safeAddress || isInList) return null

  return (
    <Box mb={2}>
      <div className={css.listHeader}>
        <Typography variant="h5" fontWeight={700} mb={2}>
          Current Safe Account
        </Typography>
      </div>

      <CurrentSafeList onLinkClick={onLinkClick} />
    </Box>
  )
}

export default CurrentSafe
