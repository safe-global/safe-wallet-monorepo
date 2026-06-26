/* eslint-disable @typescript-eslint/ban-ts-comment */
import { SafeProvider, estimateTxBaseGas, getCompatibilityFallbackHandlerContract } from '@safe-global/protocol-kit'
import type Safe from '@safe-global/protocol-kit'
import type { SafeTransaction } from '@safe-global/types-kit'
import { getSimulateTxAccessorDeployment } from '@safe-global/safe-deployments'
import { Interface, type JsonRpcProvider } from 'ethers'
import { encodeSignatures } from '../../services/encodeSignatures'
import chains from '../../config/chains'

const SIMULATE_TX_ACCESSOR_ABI = [
  'function simulate(address to, uint256 value, bytes data, uint8 operation) returns (uint256 estimate, bool success, bytes returnData)',
]

export const getEncodedSafeTx = (
  safeSDK: Safe,
  safeTx: SafeTransaction,
  from: string | undefined,
  needsSignature: boolean,
): string | undefined => {
  const EXEC_TX_METHOD = 'execTransaction'

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

export const GasMultipliers = {
  [chains.gno]: 1.3,
  [chains.zksync]: 20,
}

export const incrementByGasMultiplier = (value: bigint, multiplier: number) => {
  return (value * BigInt(100 * multiplier)) / BigInt(100)
}

/**
 * Estimates the gas limit for a transaction that will be executed on the zkSync network.
 *
 *  The rpc call for estimateGas is failing for the zkSync network, when the from address
 *  is a Safe. Quote from this discussion:
 *  https://github.com/zkSync-Community-Hub/zksync-developers/discussions/144
 *  ======================
 *  zkSync has native account abstraction and, under the hood, all accounts are a smart
 *  contract account. Even EOA use the DefaultAccount smart contract. All smart contract
 *  accounts on zkSync must be deployed using the createAccount or create2Account
 *  methods of the ContractDeployer system contract.
 *
 * When processing a transaction, the protocol checks the code of the from account and,
 * in this case, as Safe accounts are not deployed as native accounts on zkSync
 * (via createAccount or create2Account), it fails with the error above.
 * ======================
 *
 * We do some "magic" here by simulating the transaction on the SafeProxy contract
 *
 * @param web3
 * @param safeSDK
 * @param safeTx
 * @param chainId
 * @param safeAddress
 */
export const getGasLimitForZkSync = async (
  web3: JsonRpcProvider,
  safeSDK: Safe,
  safeTx: SafeTransaction,
  chainId: string,
  safeAddress: string,
) => {
  // use a random EOA address as the from address
  // https://github.com/zkSync-Community-Hub/zksync-developers/discussions/144
  const fakeEOAFromAddress = '0x330d9F4906EDA1f73f668660d1946bea71f48827'
  const customContracts = safeSDK.getContractManager().contractNetworks?.[chainId]
  const safeVersion = safeSDK.getContractVersion()
  const safeProvider = new SafeProvider({ provider: web3._getConnection().url })
  const fallbackHandlerContract = await getCompatibilityFallbackHandlerContract({
    safeProvider,
    safeVersion,
    customContracts,
  })

  const simulateTxAccessorDeployment = getSimulateTxAccessorDeployment({ version: safeVersion })
  const simulateTxAccessorAddress =
    customContracts?.simulateTxAccessorAddress ?? simulateTxAccessorDeployment?.defaultAddress
  if (!simulateTxAccessorAddress) throw new Error('SimulateTxAccessor deployment not found')
  const simulateTxAccessorIface = new Interface(SIMULATE_TX_ACCESSOR_ABI)

  // 2. Add a simulate call to the predicted SafeProxy as second transaction
  const transactionDataToEstimate: string = simulateTxAccessorIface.encodeFunctionData('simulate', [
    safeTx.data.to,
    // @ts-ignore value type mismatch
    safeTx.data.value,
    safeTx.data.data as `0x${string}`,
    safeTx.data.operation,
  ])

  const safeFunctionToEstimate: string = fallbackHandlerContract.encode('simulate', [
    simulateTxAccessorAddress as `0x${string}`,
    transactionDataToEstimate as `0x${string}`,
  ])

  const gas = await web3.estimateGas({
    to: safeAddress,
    from: fakeEOAFromAddress,
    value: '0',
    data: safeFunctionToEstimate,
  })

  // The estimateTxBaseGas function seems to estimate too low for zkSync
  const baseGas = incrementByGasMultiplier(
    BigInt(await estimateTxBaseGas(safeSDK, safeTx)),
    GasMultipliers[chains.zksync],
  )

  return BigInt(gas) + baseGas
}
