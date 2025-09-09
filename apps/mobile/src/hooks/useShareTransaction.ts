import { useCallback } from 'react'
import Share from 'react-native-share'
import { useAppSelector } from '@/src/store/hooks'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import { selectChainById } from '@/src/store/chains'
import { SAFE_WEB_TRANSACTIONS_URL } from '@/src/config/constants'

export function useShareTransaction(txId: string) {
  const activeSafe = useDefinedActiveSafe()
  const chain = useAppSelector((state) => selectChainById(state, activeSafe.chainId))

  const shareTransaction = useCallback(async () => {
    if (!chain) {
      return
    }

    const url = SAFE_WEB_TRANSACTIONS_URL.replace(
      ':safeAddressWithChainPrefix',
      `${chain.shortName}:${activeSafe.address}`,
    ).replace(':txId', txId)

    try {
      await Share.open({
        title: 'Transaction Details',
        message: `View transaction details: ${url}`,
        url,
      })
    } catch (error) {
      // User cancelled the share dialog or another error occurred
      console.log('Share cancelled or failed:', error)
    }
  }, [txId, activeSafe.address, chain])

  return shareTransaction
}
