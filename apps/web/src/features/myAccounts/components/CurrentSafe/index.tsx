import { Typography } from '@/components/ui/typography'
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
    <div data-testid="current-safe-section" className="mb-6">
      <Typography variant="h4" className="mb-4">
        Current Safe Account
      </Typography>
      <SafeListItem safeItem={safeItem} onLinkClick={onLinkClick} />
    </div>
  )
}

export default CurrentSafe
