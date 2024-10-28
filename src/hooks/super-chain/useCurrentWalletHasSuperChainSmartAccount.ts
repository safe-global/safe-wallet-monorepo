import { useEffect, useState, useCallback } from 'react'
import useSuperChainAccount from './useSuperChainAccount'
import useWallet from '../wallets/useWallet'
import { zeroAddress } from 'viem'

function useCurrentWalletHasSuperChainSmartAccount() {
  const initialState = {
    hasSuperChainSmartAccount: false,
    superChainSmartAccount: zeroAddress,
    isLoading: true,
  }
  const [hasSuperChainSmartAccount, setHasSuperChainSmartAccount] = useState(initialState)
  const { getReadOnlySuperChainSmartAccount } = useSuperChainAccount()
  const wallet = useWallet()

  const checkSuperChainAccount = useCallback(async () => {
    if (!wallet?.address) return

    const SuperChainAccountContractReadOnly = getReadOnlySuperChainSmartAccount()
    const { smartAccount } = await SuperChainAccountContractReadOnly.getUserSuperChainAccount(wallet.address)

    setHasSuperChainSmartAccount({
      hasSuperChainSmartAccount: smartAccount !== zeroAddress,
      superChainSmartAccount: smartAccount,
      isLoading: false,
    })
  }, [wallet?.address, getReadOnlySuperChainSmartAccount])

  useEffect(() => {
    checkSuperChainAccount()
  }, [checkSuperChainAccount])

  return hasSuperChainSmartAccount
}

export default useCurrentWalletHasSuperChainSmartAccount
