import { EIP1193Provider, useWallets } from '@privy-io/react-auth'
import { useEffect, useState } from 'react'
import { type Address, createWalletClient, custom } from 'viem'
import { sepolia, optimism } from 'viem/chains'
import { walletClientToSmartAccountSigner } from 'permissionless'
import { useAppSelector } from '@/store'
import { selectSuperChainAccount } from '@/store/superChainAccountSlice'
import { getSmartAccountClient } from '@/services/pimlico'
import useWallet from './wallets/useWallet'
import { CHAIN_ID } from '@/features/superChain/constants'

type SmartAccountClient = ReturnType<typeof getSmartAccountClient> extends Promise<infer U> ? U : never

function usePimlico() {
  const wallet = useWallet()
  const [smartAccountClient, setSmartAccountClient] = useState<SmartAccountClient>()
  const superChainSmartAccount = useAppSelector(selectSuperChainAccount)
  useEffect(() => {
    ;(async () => {
      if (!wallet || superChainSmartAccount.loading || superChainSmartAccount.error) return
      const eip1193provider = wallet?.provider

      // Create a viem WalletClient from the embedded wallet's EIP1193 provider
      // This will be used as the signer for the user's smart account

      const privyClient = createWalletClient({
        account: wallet.address as Address,
        chain: CHAIN_ID === sepolia.id.toString() ? sepolia : optimism, // Replace this with the chain used by your application
        transport: custom(eip1193provider as EIP1193Provider),
      })

      const signer = walletClientToSmartAccountSigner(privyClient)
      const smartAccountClient = await getSmartAccountClient(signer, superChainSmartAccount.data.smartAccount)
      setSmartAccountClient(smartAccountClient)
    })()
  }, [wallet, superChainSmartAccount])

  return { smartAccountClient }
}

export default usePimlico
