import {
  CHAIN_ID,
  JSON_RPC_PROVIDER,
  SUPER_CHAIN_ACCOUNT_MODULE_ADDRESS,
  SUPER_CHAIN_MODULE_ABI,
} from '@/features/superChain/constants'
import { publicClient } from '@/services/pimlico'
import { Contract, JsonRpcProvider } from 'ethers'
import { type Address, createPublicClient, createWalletClient, custom, getContract, http } from 'viem'
import usePimlico from '../usePimlico'
import { sepolia, optimism } from 'viem/chains'
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
      chain: CHAIN_ID === sepolia.id.toString() ? sepolia : optimism,
      transport: custom(wallet.provider),
      account: wallet.address as Address,
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
  const publicClient = createPublicClient({
    chain: CHAIN_ID === sepolia.id.toString() ? sepolia : optimism,
    transport: http(),
  })
  return {
    getReadOnlySuperChainSmartAccount,
    getSponsoredWriteableSuperChainSmartAccount,
    getWriteableSuperChainSmartAccount,
    publicClient,
  }
}

export default useSuperChainAccount
