import {
  JSON_RPC_PROVIDER,
  SUPER_CHAIN_ACCOUNT_MODULE_ADDRESS,
  SUPER_CHAIN_MODULE_ABI,
} from '@/features/superChain/constants'
import { publicClient } from '@/services/pimlico'
import { Contract, JsonRpcProvider } from 'ethers'
import { createWalletClient, custom, getContract } from 'viem'
import usePimlico from '../usePimlico'
import { sepolia } from 'viem/chains'
import useWallet from '../wallets/useWallet'

function useSuperChainAccount() {
  const { smartAccountClient } = usePimlico()
  const wallet = useWallet()

  const getReadOnlySuperChainSmartAccount = () => {
    const SuperChainAccountContractReadOnly = new Contract(
      SUPER_CHAIN_ACCOUNT_MODULE_ADDRESS,
      SUPER_CHAIN_MODULE_ABI,
      new JsonRpcProvider(JSON_RPC_PROVIDER),
    )
    return SuperChainAccountContractReadOnly
  }

  const getSponsoredWriteableSuperChainSmartAccount = () => {
    if (!smartAccountClient) return
    const SuperChainAccountContractWriteable = getContract({
      address: SUPER_CHAIN_ACCOUNT_MODULE_ADDRESS,
      abi: SUPER_CHAIN_MODULE_ABI,
      client: {
        public: publicClient,
        wallet: smartAccountClient,
      },
    })
    return SuperChainAccountContractWriteable
  }

  const getWriteableSuperChainSmartAccount = () => {
    if (!wallet) return
    const walletClient = createWalletClient({
      chain: sepolia,
      transport: custom(wallet.provider),
    })
    const SuperChainAccountContractWriteable = getContract({
      address: SUPER_CHAIN_ACCOUNT_MODULE_ADDRESS,
      abi: SUPER_CHAIN_MODULE_ABI,
      client: {
        public: publicClient,
        wallet: walletClient,
      },
    })
    return SuperChainAccountContractWriteable
  }

  return {
    getReadOnlySuperChainSmartAccount,
    getSponsoredWriteableSuperChainSmartAccount,
    getWriteableSuperChainSmartAccount,
  }
}

export default useSuperChainAccount
