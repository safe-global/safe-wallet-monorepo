import { getUserNonce } from '@/src/services/web3'
import { ExecutionMethod } from '@/src/features/HowToExecuteSheet/types'
import { ledgerExecutionService } from '@/src/services/ledger/ledger-execution.service'
import { ledgerDMKService } from '@/src/services/ledger/ledger-dmk.service'
import { store } from '@/src/store'
import { selectSignerByAddress } from '@/src/store/signersSlice'
import type { EstimatedFeeValues } from '@/src/store/estimatedFeeSlice'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import type { SafeInfo } from '@/src/types/address'

interface ExecuteLedgerTxParams {
  chain: Chain
  activeSafe: SafeInfo
  txId: string
  signerAddress: string
  feeParams: EstimatedFeeValues | null
}

interface ExecuteLedgerTxResult {
  type: ExecutionMethod.WITH_PK
  txId: string
  chainId: string
  safeAddress: string
  txHash: string
  walletAddress: string
  walletNonce: number
}

export const executeLedgerTx = async ({
  chain,
  activeSafe,
  txId,
  signerAddress,
  feeParams,
}: ExecuteLedgerTxParams): Promise<ExecuteLedgerTxResult> => {
  const signer = selectSignerByAddress(store.getState(), signerAddress)

  if (!signer) {
    throw new Error('Signer not found')
  }

  if (signer.type !== 'ledger') {
    throw new Error('Expected Ledger signer but got different type')
  }

  if (!signer.derivationPath) {
    throw new Error('Ledger signer missing derivation path')
  }

  // Execute with Ledger
  const { hash } = await ledgerExecutionService.executeTransaction({
    chain,
    activeSafe,
    txId,
    signerAddress,
    derivationPath: signer.derivationPath,
    feeParams,
  })

  // Get wallet nonce for tracking
  const walletNonce = await getUserNonce(chain, signerAddress)

  // Disconnect to prevent DMK background pinger from continuing after execution
  await ledgerDMKService.disconnect()

  return {
    // From here on, the transaction tracking in the app assumes the execution was done with a private key
    // in theory, ledger signs with a PK anyway
    type: ExecutionMethod.WITH_PK,
    txId,
    chainId: chain.chainId,
    safeAddress: activeSafe.address,
    txHash: hash,
    walletAddress: signerAddress,
    walletNonce,
  }
}
