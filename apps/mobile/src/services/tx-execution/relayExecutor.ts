import { createTx, addSignaturesToTx } from '@/src/services/tx/tx-sender/create'
import { getReadOnlyCurrentGnosisSafeContract } from '@/src/services/contracts/safeContracts'
import { getLatestSafeVersion } from '@safe-global/utils/utils/chains'
import extractTxInfo from '@/src/services/tx/extractTx'
import { fetchTransactionDetails } from '@/src/services/tx/fetchTransactionDetails'
import { ExecutionMethod } from '@/src/features/HowToExecuteSheet/types'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import type { SafeState } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import type { SafeInfo } from '@/src/types/address'

interface ExecuteRelayTxParams {
  chain: Chain
  activeSafe: SafeInfo
  safe: SafeState
  txId: string
  relayMutation: (args: {
    chainId: string
    relayDto: {
      to: string
      data: string
      version: string
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

  // Call relay mutation
  const relayResponse = await relayMutation({
    chainId: chain.chainId,
    relayDto: {
      to: safe.address.value,
      data,
      version: safe.version ?? getLatestSafeVersion(chain),
    },
  })

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
