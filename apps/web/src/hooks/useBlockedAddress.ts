import useSafeInfo from '@/hooks/useSafeInfo'
import useWallet from '@/hooks/wallets/useWallet'
import { useGetIsSanctionedQuery } from '@/store/api/ofac'
import { skipToken } from '@reduxjs/toolkit/query/react'
import { getKeyWithTrueValue } from '@/utils/helpers'

/**
 * Checks the connected wallet and current safe address
 * against OFAC and returns either address if on the list
 */
const useBlockedAddress = () => {
  const { safeAddress } = useSafeInfo()
  const wallet = useWallet()

  const { data: isSafeAddressBlocked } = useGetIsSanctionedQuery(safeAddress || skipToken)
  const { data: isWalletAddressBlocked } = useGetIsSanctionedQuery(wallet?.address || skipToken)
  const blockedAddresses = {
    [safeAddress]: !!isSafeAddressBlocked,
    [wallet?.address || '']: !!isWalletAddressBlocked,
  }

  return getKeyWithTrueValue(blockedAddresses)
}

export default useBlockedAddress
