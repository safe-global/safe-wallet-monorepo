import {
  JSON_RPC_PROVIDER,
  SUPER_CHAIN_ACCOUNT_MODULE_ADDRESS,
  SUPER_CHAIN_MODULE_ABI,
} from '@/features/superChain/constants'
import { publicClient } from '@/services/pimlico'
import { Contract, JsonRpcProvider } from 'ethers'
import { getContract } from 'viem'
import usePimlico from '../usePimlico'

function useSuperChainAccount() {
  const { smartAccountClient } = usePimlico()

  const getReadOnlySuperChainSmartAccount = () => {
    const SuperChainAccountContractReadOnly = new Contract(
      SUPER_CHAIN_ACCOUNT_MODULE_ADDRESS,
      SUPER_CHAIN_MODULE_ABI,
      new JsonRpcProvider(JSON_RPC_PROVIDER),
    )
    return SuperChainAccountContractReadOnly
  }

  const getSponsoredWriteableSuperChainSmartAccount = () => {
    console.debug({ smartAccountClient })
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

  return { getReadOnlySuperChainSmartAccount, getSponsoredWriteableSuperChainSmartAccount }
}

export default useSuperChainAccount
