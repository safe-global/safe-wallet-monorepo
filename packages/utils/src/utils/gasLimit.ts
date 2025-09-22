import { SafeProvider } from '@safe-global/protocol-kit'
import type Safe from '@safe-global/protocol-kit'
import { estimateTxBaseGas } from '@safe-global/protocol-kit/dist/src/utils/transactions/gas'
import {
  getCompatibilityFallbackHandlerContract,
  getSimulateTxAccessorContract,
} from '@safe-global/protocol-kit/dist/src/contracts/safeDeploymentContracts'
import type { SafeTransaction } from '@safe-global/types-kit'
import type { JsonRpcProvider } from 'ethers'
import chains from '../config/chains'
import { encodeSignatures } from '../services/tx/encodeSignatures'

export const GAS_MULTIPLIERS: Record<string, number> = {
  [chains.gno]: 1.3,
  [chains.zksync]: 20,
}

export const incrementByGasMultiplier = (value: bigint, multiplier: number): bigint => {
  return (value * BigInt(100 * multiplier)) / BigInt(100)
}

const EXEC_TX_METHOD = 'execTransaction'
const ZKSYNC_FAKE_EOA = '0x330d9F4906EDA1f73f668660d1946bea71f48827'

export const getEncodedSafeTx = (
  safeSDK: Safe,
  safeTx: SafeTransaction,
  from: string | undefined,
  needsSignature: boolean,
): string | undefined => {
  // @ts-ignore union type is too complex
  return safeSDK
    .getContractManager()
    .safeContract?.encode(EXEC_TX_METHOD, [
      safeTx.data.to,
      safeTx.data.value,
      safeTx.data.data,
      safeTx.data.operation,
      safeTx.data.safeTxGas,
      safeTx.data.baseGas,
      safeTx.data.gasPrice,
      safeTx.data.gasToken,
      safeTx.data.refundReceiver,
      encodeSignatures(safeTx, from, needsSignature),
    ])
}

export type GetGasLimitForZkSyncParams = {
  safeAddress: string
  chainId: string
  provider: JsonRpcProvider
  safeSDK: Safe
  safeTx: SafeTransaction
}

export const getGasLimitForZkSync = async ({
  safeAddress,
  chainId,
  provider,
  safeSDK,
  safeTx,
}: GetGasLimitForZkSyncParams): Promise<bigint> => {
  const customContracts = safeSDK.getContractManager().contractNetworks?.[chainId]
  const safeVersion = safeSDK.getContractVersion()
  const safeProvider = new SafeProvider({ provider: provider._getConnection().url })
  const fallbackHandlerContract = await getCompatibilityFallbackHandlerContract({
    safeProvider,
    safeVersion,
    customContracts,
  })

  const simulateTxAccessorContract = await getSimulateTxAccessorContract({
    safeProvider,
    safeVersion,
    customContracts,
  })

  // 2. Add a simulate call to the predicted SafeProxy as second transaction
  const transactionDataToEstimate: string = simulateTxAccessorContract.encode('simulate', [
    safeTx.data.to,
    // @ts-ignore
    safeTx.data.value,
    safeTx.data.data as `0x${string}`,
    safeTx.data.operation,
  ])

  const safeFunctionToEstimate: string = fallbackHandlerContract.encode('simulate', [
    simulateTxAccessorContract.getAddress(),
    transactionDataToEstimate as `0x${string}`,
  ])

  const gas = await provider.estimateGas({
    to: safeAddress,
    from: ZKSYNC_FAKE_EOA,
    value: '0',
    data: safeFunctionToEstimate,
  })

  const multiplier = GAS_MULTIPLIERS[chainId] ?? GAS_MULTIPLIERS[chains.zksync] ?? 1
  const baseGas = incrementByGasMultiplier(BigInt(await estimateTxBaseGas(safeSDK, safeTx)), multiplier)

  return BigInt(gas) + baseGas
}
