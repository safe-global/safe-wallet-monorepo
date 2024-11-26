import { useEffect, useState } from 'react'
import { type Address, createWalletClient, custom, EIP1193Provider } from 'viem'
import { optimism } from 'viem/chains'
import { useAppSelector } from '@/store'
import { selectSuperChainAccount } from '@/store/superChainAccountSlice'
import { getSmartAccountClient } from '@/services/pimlico'
import useWallet from './wallets/useWallet'

type SmartAccountClient = ReturnType<typeof getSmartAccountClient> extends Promise<infer U> ? U : never

function usePimlico() {
  const wallet = useWallet()
  // const { getAccessToken } = usePrivy()
  const [smartAccountClient, setSmartAccountClient] = useState<SmartAccountClient>()
  const superChainSmartAccount = useAppSelector(selectSuperChainAccount)

  useEffect(() => {
    ;(async () => {
      // const jwt = await getAccessToken()
      if (!wallet || superChainSmartAccount.loading || superChainSmartAccount.error) return
      const eip1193provider = wallet?.provider

      // Create a viem WalletClient from the embedded wallet's EIP1193 provider
      // This will be used as the signer for the user's smart account

      const walletClient = createWalletClient({
        account: wallet.address as Address,
        chain: optimism,
        transport: custom(eip1193provider as EIP1193Provider),
      })

      const smartAccountClient = await getSmartAccountClient(walletClient, superChainSmartAccount.data.smartAccount)
      setSmartAccountClient(smartAccountClient)
    })()
  }, [wallet, superChainSmartAccount])

  return { smartAccountClient }
}

export default usePimlico
