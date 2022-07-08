import { LATEST_SAFE_VERSION } from '@/config/constants'
import { MetaTransactionData, OperationType } from '@gnosis.pm/safe-core-sdk-types'
import {
  getFallbackHandlerDeployment,
  getSafeL2SingletonDeployment,
  getSafeSingletonDeployment,
} from '@gnosis.pm/safe-deployments'
import { ChainInfo } from '@gnosis.pm/safe-react-gateway-sdk'
import { ethers } from 'ethers'

export const CHANGE_MASTER_COPY_ABI = 'function changeMasterCopy(address _masterCopy)'
export const CHANGE_FALLBACK_HANDLER_ABI = 'function setFallbackHandler(address handler)'

const getLatestFallbackHandlerAddress = (chainId: string) => {
  const fallbackHandlerDeployment =
    getFallbackHandlerDeployment({
      version: LATEST_SAFE_VERSION,
      network: chainId,
    }) ||
    getFallbackHandlerDeployment({
      version: LATEST_SAFE_VERSION,
    })

  return fallbackHandlerDeployment?.networkAddresses[chainId]
}

const getLatestMasterCopyAddress = (chain: ChainInfo) => {
  const useL2MasterCopy = chain.l2
  const getDeployment = useL2MasterCopy ? getSafeL2SingletonDeployment : getSafeSingletonDeployment
  const masterCopyDeployment =
    getDeployment({ version: LATEST_SAFE_VERSION, network: chain.chainId }) ||
    getDeployment({ version: LATEST_SAFE_VERSION })

  return masterCopyDeployment?.networkAddresses[chain.chainId]
}

/**
 * Creates two transactions:
 * - change the mastercopy address
 * - set the fallback handler address
 * Only works for safes < 1.3.0 as the changeMasterCopy function was removed
 */
export const createUpdateSafeTxs = (safeAddress: string, chain: ChainInfo): MetaTransactionData[] => {
  const latestMasterCopyAddress = getLatestMasterCopyAddress(chain)
  const safeContractInterface = new ethers.utils.Interface([CHANGE_MASTER_COPY_ABI, CHANGE_FALLBACK_HANDLER_ABI])
  const changeMasterCopyCallData = safeContractInterface.encodeFunctionData('changeMasterCopy', [
    latestMasterCopyAddress,
  ])

  const fallbackHandlerAddress = getLatestFallbackHandlerAddress(chain.chainId)
  const changeFallbackHandlerCallData = safeContractInterface.encodeFunctionData('setFallbackHandler', [
    fallbackHandlerAddress,
  ])

  const txs: MetaTransactionData[] = [
    {
      to: safeAddress,
      value: '0',
      data: changeMasterCopyCallData,
      operation: OperationType.Call,
    },
    {
      to: safeAddress,
      value: '0',
      data: changeFallbackHandlerCallData,
      operation: OperationType.Call,
    },
  ]

  return txs
}
