import useAsync from '@safe-global/utils/hooks/useAsync'
import useChainId from '@/hooks/useChainId'
import useOnboard from '@/hooks/wallets/useOnboard'
import useWallet from '@/hooks/wallets/useWallet'
import { getSafeSDKWithSigner } from '@/services/tx/tx-sender/sdk'
import {
  estimateSafeDeploymentGas,
  estimateTxBaseGas,
  getCompatibilityFallbackHandlerContract,
} from '@safe-global/protocol-kit'
import type Safe from '@safe-global/protocol-kit'

import { OperationType, type SafeTransaction } from '@safe-global/types-kit'
import { getSimulateTxAccessorDeployment } from '@safe-global/safe-deployments'
import { Interface } from 'ethers'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'

const SIMULATE_TX_ACCESSOR_ABI = [
  'function simulate(address to, uint256 value, bytes data, uint8 operation) returns (uint256 estimate, bool success, bytes returnData)',
]

// Safe singleton's own simulation entrypoint (StorageAccessible, >=1.3.0) — handler-independent,
// but it reverts by design, so it must be wrapped in a call that tolerates the revert
const SIMULATE_AND_REVERT_ABI = ['function simulateAndRevert(address targetContract, bytes calldataPayload)']

// Canonical Multicall3, deployed at the same address on virtually every network.
// tryAggregate(false, ...) swallows the designed revert of simulateAndRevert while its gas still
// counts towards the batch estimate.
const MULTICALL3_ADDRESS = '0xcA11bde05977b3631167028862bE2a173976CA11'
const MULTICALL3_ABI = [
  'function tryAggregate(bool requireSuccess, (address target, bytes callData)[] calls) payable returns ((bool success, bytes returnData)[] returnData)',
]

// execTransaction cost on top of the inner call: signature checks, events and refund handling
const EXEC_TRANSACTION_OVERHEAD_GAS = 60_000n
// Used when the inner transaction cannot be estimated standalone (e.g. delegatecall or value from an unfunded Safe)
const FALLBACK_INNER_TX_GAS = 250_000n

type DeployGasLimitProps = {
  safeTxGas: bigint
  safeDeploymentGas: string
  totalGas: bigint
}

const useDeployGasLimit = (safeTx?: SafeTransaction) => {
  const onboard = useOnboard()
  const wallet = useWallet()
  const chainId = useChainId()

  const [gasLimit, gasLimitError, gasLimitLoading] = useAsync<DeployGasLimitProps | undefined>(async () => {
    if (!wallet || !onboard) return

    const sdk = await getSafeSDKWithSigner(wallet.provider)

    const [baseGas, batchTxGas, safeDeploymentGas] = await Promise.all([
      safeTx ? estimateTxBaseGas(sdk, safeTx) : '0',
      safeTx ? estimateBatchDeploymentTransaction(safeTx, sdk, chainId) : '0',
      estimateSafeDeploymentGas(sdk),
    ])

    const totalGas = safeTx ? BigInt(baseGas) + BigInt(batchTxGas) : BigInt(safeDeploymentGas)
    const safeTxGas = totalGas - BigInt(safeDeploymentGas)

    return { safeTxGas, safeDeploymentGas, totalGas }
  }, [onboard, wallet, chainId, safeTx])

  return { gasLimit, gasLimitError, gasLimitLoading }
}

/**
 * Estimates batch transaction containing the safe deployment and the first transaction.
 *
 * This estimation is done by calling `eth_estimateGas` with a MultiSendCallOnly batch transaction that
 *   1. Calls the SafeProxyFactory to deploy the SafeProxy
 *   2. Call the `simulate` function on the now deployed SafeProxy with the first transaction data.
 * Then we substract a flat gas amount for the overhead of simulating the transaction.
 *
 * The `simulate` entrypoint only exists on the CompatibilityFallbackHandler. For a Safe set up
 * with the ExtensibleFallbackHandler it reverts, so the estimation cascades:
 *   1. CFH `simulate` via the fallback dispatch (existing behaviour, byte-identical for CFH Safes)
 *   2. The singleton's own `simulateAndRevert` wrapped in Multicall3.tryAggregate — the wrapper
 *      swallows the designed revert while its gas still counts towards the batch estimate
 *   3. An additive estimate (deployment + standalone inner tx + execTransaction overhead)
 *
 * Note: To have a more accurate estimation the base gas of a Safe Transaction has to be added to the result
 * @param safeTransaction - first SafeTransaction that should be batched with the deployment
 * @param sdk - predicted Safe instance
 * @param chainId - chainId of the Safe
 * @returns the gas estimation for the batch (as `bigint`)
 */
export const estimateBatchDeploymentTransaction = async (
  safeTransaction: SafeTransaction,
  sdk: Safe,
  chainId: string,
) => {
  try {
    return await estimateBatchViaHandlerSimulation(safeTransaction, sdk, chainId)
  } catch {
    try {
      return await estimateBatchViaSimulateAndRevert(safeTransaction, sdk, chainId)
    } catch {
      return estimateBatchAdditive(safeTransaction, sdk)
    }
  }
}

const encodeSimulateTxAccessorCall = (
  safeTransaction: SafeTransaction,
  sdk: Safe,
  chainId: string,
): { simulateTxAccessorAddress: string; simulationCalldata: string } => {
  const customContracts = sdk.getContractManager().contractNetworks?.[chainId]
  const safeVersion = sdk.getContractVersion()

  const simulateTxAccessorDeployment = getSimulateTxAccessorDeployment({ version: safeVersion })
  const simulateTxAccessorAddress =
    customContracts?.simulateTxAccessorAddress ?? simulateTxAccessorDeployment?.defaultAddress
  if (!simulateTxAccessorAddress) throw new Error('SimulateTxAccessor deployment not found')
  const simulateTxAccessorIface = new Interface(SIMULATE_TX_ACCESSOR_ABI)

  const simulationCalldata = simulateTxAccessorIface.encodeFunctionData('simulate', [
    safeTransaction.data.to,
    BigInt(safeTransaction.data.value),
    safeTransaction.data.data as `0x${string}`,
    safeTransaction.data.operation,
  ])

  return { simulateTxAccessorAddress, simulationCalldata }
}

const getDeploymentBatchTransaction = async (sdk: Safe) => {
  const safeDeploymentTransaction = await sdk.createSafeDeploymentTransaction()
  return {
    to: safeDeploymentTransaction.to,
    value: safeDeploymentTransaction.value,
    data: safeDeploymentTransaction.data,
    operation: OperationType.Call,
  }
}

const estimateDeploymentBatch = async (
  sdk: Safe,
  simulationTransaction: { to: string; value: string; data: string; operation: OperationType },
) => {
  const safeProvider = sdk.getSafeProvider()

  const safeDeploymentBatch = await sdk.createTransactionBatch([
    await getDeploymentBatchTransaction(sdk),
    simulationTransaction,
  ])

  const signerAddress = await safeProvider.getSignerAddress()

  // estimate the entire batch
  const safeTxGas = await safeProvider.estimateGas({
    ...safeDeploymentBatch,
    from: signerAddress || ZERO_ADDRESS, // This address should not really matter
  })

  // Substract ~20k gas for the simulation overhead
  return BigInt(safeTxGas) - 20_000n
}

const estimateBatchViaHandlerSimulation = async (safeTransaction: SafeTransaction, sdk: Safe, chainId: string) => {
  const customContracts = sdk.getContractManager().contractNetworks?.[chainId]
  const safeVersion = sdk.getContractVersion()
  const safeProvider = sdk.getSafeProvider()
  const fallbackHandlerContract = await getCompatibilityFallbackHandlerContract({
    safeProvider,
    safeVersion,
    customContracts,
  })

  const { simulateTxAccessorAddress, simulationCalldata } = encodeSimulateTxAccessorCall(safeTransaction, sdk, chainId)

  // Call `simulate` on the predicted SafeProxy; the Safe forwards it to the CompatibilityFallbackHandler
  const safeFunctionToEstimate: string = fallbackHandlerContract.encode('simulate', [
    simulateTxAccessorAddress as `0x${string}`,
    simulationCalldata as `0x${string}`,
  ])

  return estimateDeploymentBatch(sdk, {
    to: await sdk.getAddress(),
    value: '0',
    data: safeFunctionToEstimate,
    operation: OperationType.Call,
  })
}

const estimateBatchViaSimulateAndRevert = async (safeTransaction: SafeTransaction, sdk: Safe, chainId: string) => {
  const safeProvider = sdk.getSafeProvider()

  // Without Multicall3, a call to its address succeeds with empty output and the estimate would be
  // silently meaningless
  if (!(await safeProvider.isContractDeployed(MULTICALL3_ADDRESS))) {
    throw new Error('Multicall3 is not deployed on the current network')
  }

  const { simulateTxAccessorAddress, simulationCalldata } = encodeSimulateTxAccessorCall(safeTransaction, sdk, chainId)

  const simulateAndRevertCalldata = new Interface(SIMULATE_AND_REVERT_ABI).encodeFunctionData('simulateAndRevert', [
    simulateTxAccessorAddress,
    simulationCalldata,
  ])

  const tryAggregateCalldata = new Interface(MULTICALL3_ABI).encodeFunctionData('tryAggregate', [
    false,
    [{ target: await sdk.getAddress(), callData: simulateAndRevertCalldata }],
  ])

  return estimateDeploymentBatch(sdk, {
    to: MULTICALL3_ADDRESS,
    value: '0',
    data: tryAggregateCalldata,
    operation: OperationType.Call,
  })
}

const estimateBatchAdditive = async (safeTransaction: SafeTransaction, sdk: Safe) => {
  const safeProvider = sdk.getSafeProvider()

  const [deploymentGas, innerTxGas] = await Promise.all([
    estimateSafeDeploymentGas(sdk),
    safeTransaction.data.operation === OperationType.Call
      ? sdk
          .getAddress()
          .then((safeAddress) =>
            safeProvider.estimateGas({
              from: safeAddress,
              to: safeTransaction.data.to,
              value: safeTransaction.data.value,
              data: safeTransaction.data.data,
            }),
          )
          .then(BigInt)
          .catch(() => FALLBACK_INNER_TX_GAS)
      : Promise.resolve(FALLBACK_INNER_TX_GAS),
  ])

  return BigInt(deploymentGas) + innerTxGas + EXEC_TRANSACTION_OVERHEAD_GAS
}

export default useDeployGasLimit
