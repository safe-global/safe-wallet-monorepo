import { useEffect, useState } from 'react'
import useSuperChainAccount from './useSuperChainAccount'
import useWallet from '../wallets/useWallet'
import { zeroAddress } from 'viem'

function useCurrentWalletHasSuperChainSmartAccount() {
  const [hasSuperChainSmartAccount, setHasSuperChainSmartAccount] = useState({
    hasSuperChainSmartAccount: false,
    superChainSmartAccount: zeroAddress,
  })
  const { getReadOnlySuperChainSmartAccount } = useSuperChainAccount()
  const wallet = useWallet()
  useEffect(() => {
    const SuperChainAccountContractReadOnly = getReadOnlySuperChainSmartAccount()
    if (wallet) {
      ;(async () => {
        if (!wallet.address) {
          return
        }
        const hasSuperChainSmartAcount = await SuperChainAccountContractReadOnly.getUserSuperChainAccount(
          wallet.address,
        )
        if (hasSuperChainSmartAcount.smartAccount !== zeroAddress) {
          setHasSuperChainSmartAccount({
            hasSuperChainSmartAccount: true,
            superChainSmartAccount: hasSuperChainSmartAcount.smartAccount,
          })
        }
      })()
    }
  }, [wallet?.address])

  return hasSuperChainSmartAccount
}

export default useCurrentWalletHasSuperChainSmartAccount
