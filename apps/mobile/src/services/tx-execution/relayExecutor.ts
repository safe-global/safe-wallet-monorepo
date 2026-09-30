import { createTx, addSignaturesToTx } from '@/src/services/tx/tx-sender/create'
import { getReadOnlyCurrentGnosisSafeContract } from '@/src/services/contracts/safeContracts'
import { getLatestSafeVersion } from '@safe-global/utils/utils/chains'
import extractTxInfo from '@/src/services/tx/extractTx'
import { fetchTransactionDetails } from '@/src/services/tx/fetchTransactionDetails'
import { getSafeSDK } from '@/src/hooks/coreSDK/safeCoreSDK'
import { getRelaySimulationError } from '@safe-global/utils/services/relayErrors'
import { ExecutionMethod } from '@/src/features/HowToExecuteSheet/types'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import type { SafeState } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import type { SafeInfo } from '@/src/types/address'

interface ExecuteRelayTxParams {
  chain: Chain
  activeSafe: SafeInfo
  safe: SafeState
  txId: string
  acceptUnverifiedSimulation?: boolean
  relayMutation: (args: {
    chainId: string
    relayDto: {
      to: string
      data: string
      version: string
      safeTxHash: string
      acceptUnverifiedSimulation?: boolean
    }
  }) => Promise<{ taskId: string }>
}

interface ExecuteRelayTxResult {
  type: ExecutionMethod.WITH_RELAY
  txId: string
  taskId: string
  chainId: string
  safeAddress: string
}

export const executeRelayTx = async ({
  chain,
  activeSafe,
  safe,
  txId,
  acceptUnverifiedSimulation,
  relayMutation,
}: ExecuteRelayTxParams): Promise<ExecuteRelayTxResult> => {
  const txDetails = await fetchTransactionDetails(activeSafe.chainId, txId)
  const { txParams, signatures } = extractTxInfo(txDetails, activeSafe.address)

  // Get the Safe transaction and signatures
  const safeTx = await createTx(txParams, txParams.nonce)

  if (!safeTx) {
    throw new Error('Safe transaction not found')
  }

  // Add all signatures to the transaction
  addSignaturesToTx(safeTx, signatures)

  // Compute the safeTxHash from the payload exactly as it came from CGW. CGW's GTF relay validation
  // checks the submitted execTransaction calldata field-by-field against the stored proposal, so the
  // hash must match the loaded tx — no field of `txParams` is recomputed anywhere on this path.
  const safeSDK = getSafeSDK()
  if (!safeSDK) {
    throw new Error('The Safe SDK could not be initialized.')
  }
  const safeTxHash = await safeSDK.getTransactionHash(safeTx)

  // Get readonly safe contract to encode the transaction
  const readOnlySafeContract = await getReadOnlyCurrentGnosisSafeContract(safe)

  // Encode the execTransaction call
  const data = readOnlySafeContract.encode('execTransaction', [
    safeTx.data.to,
    safeTx.data.value,
    safeTx.data.data,
    safeTx.data.operation,
    safeTx.data.safeTxGas,
    safeTx.data.baseGas,
    safeTx.data.gasPrice,
    safeTx.data.gasToken,
    safeTx.data.refundReceiver,
    safeTx.encodedSignatures(),
  ])

  // Call relay mutation. `safeTxHash` is sent unconditionally — CGW's non-GTF relayers accept and
  // ignore it, so it's a no-op off GTF chains. The CGW pre-relay simulation surfaces
  // SIMULATION_FAILED / INDETERMINATE_SIMULATION as a typed RelaySimulationError so the UI can block
  // or offer an explicit retry; everything else propagates unchanged.
  let relayResponse: { taskId: string }
  try {
    relayResponse = await relayMutation({
      chainId: chain.chainId,
      relayDto: {
        to: safe.address.value,
        data,
        version: safe.version ?? getLatestSafeVersion(chain),
        safeTxHash,
        acceptUnverifiedSimulation,
      },
    })
  } catch (error) {
    const simulationError = getRelaySimulationError(error)
    if (simulationError) {
      throw simulationError
    }
    throw error
  }

  const taskId = relayResponse.taskId

  if (!taskId) {
    throw new Error('Transaction could not be relayed')
  }

  return {
    type: ExecutionMethod.WITH_RELAY,
    txId,
    taskId,
    chainId: chain.chainId,
    safeAddress: activeSafe.address,
  }
}
