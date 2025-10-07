import { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { SafeInfo } from '@/src/types/address'
import { createWeb3ReadOnly } from '@/src/services/web3'
import { ledgerDMKService } from './ledger-dmk.service'
import { ledgerEthereumService } from './ledger-ethereum.service'
import logger from '@/src/utils/logger'
import { generatePreValidatedSignature } from '@safe-global/protocol-kit/dist/src/utils'
import { Transaction } from 'ethers'
import extractTxInfo from '@/src/services/tx/extractTx'
import { fetchTransactionDetails } from '../tx/fetchTransactionDetails'
import { createExistingTx } from '../tx/tx-sender/create'
import { getSafeSDK } from '@/src/hooks/coreSDK/safeCoreSDK'

export interface LedgerExecutionParams {
  chain: Chain
  activeSafe: SafeInfo
  txId: string
  signerAddress: string
  derivationPath: string
}

export interface LedgerExecutionResult {
  hash: string
}

/**
 * Service for executing Safe transactions with Ledger device
 */
export class LedgerExecutionService {
  private static instance: LedgerExecutionService

  public static getInstance(): LedgerExecutionService {
    if (!LedgerExecutionService.instance) {
      LedgerExecutionService.instance = new LedgerExecutionService()
    }
    return LedgerExecutionService.instance
  }

  /**
   * Ensure Ledger device is connected
   */
  public async ensureLedgerConnection(): Promise<void> {
    const session = ledgerDMKService.getCurrentSession()
    if (!session) {
      throw new Error('No active Ledger session found. Please connect your Ledger device.')
    }
  }

  /**
   * Execute a Safe transaction with Ledger device
   * This follows the web app's approach of preparing the transaction
   * apps/web/src/services/tx/tx-sender/sdk.ts
   *
   * TODO: refactor to helper functions in the utils package
   */
  public async executeTransaction(params: LedgerExecutionParams): Promise<LedgerExecutionResult> {
    const { chain, activeSafe, txId, signerAddress, derivationPath } = params

    try {
      // Get current Ledger session
      const session = ledgerDMKService.getCurrentSession()
      if (!session) {
        throw new Error('No active Ledger session found. Please connect your Ledger device.')
      }

      // Get the global Safe SDK instance (already initialized with proper validation)
      const sdk = getSafeSDK()
      if (!sdk) {
        throw new Error('Safe SDK not initialized. Please ensure a Safe is selected.')
      }

      // Get the provider for transaction signing
      const provider = createWeb3ReadOnly(chain)
      if (!provider) {
        throw new Error('Failed to create provider')
      }

      // Get transaction details from gateway using RTK Query
      const txDetails = await fetchTransactionDetails(activeSafe.chainId, txId)

      // Extract transaction parameters and existing signatures
      const { txParams, signatures } = extractTxInfo(txDetails, activeSafe.address)

      // Create Safe transaction with existing signatures
      const safeTx = await createExistingTx(txParams, signatures)

      // Check if we need more signatures and add pre-validated signature for executor
      const threshold = await sdk.getThreshold()
      const owners = await sdk.getOwners()

      // Add pre-validated signatures for owners who have approved
      const txHash = await sdk.getTransactionHash(safeTx)
      const ownersWhoApprovedTx = await sdk.getOwnersWhoApprovedTx(txHash)
      for (const owner of ownersWhoApprovedTx) {
        if (!safeTx.signatures.has(owner.toLowerCase())) {
          safeTx.addSignature(generatePreValidatedSignature(owner))
        }
      }

      // If executor is an owner and we still need signatures, add pre-validated for them
      if (threshold > safeTx.signatures.size && owners.includes(signerAddress)) {
        safeTx.addSignature(generatePreValidatedSignature(signerAddress))
      }

      // Verify we have enough signatures
      if (threshold > safeTx.signatures.size) {
        const signaturesMissing = threshold - safeTx.signatures.size
        throw new Error(
          `There ${signaturesMissing > 1 ? 'are' : 'is'} ${signaturesMissing} signature${
            signaturesMissing > 1 ? 's' : ''
          } missing`,
        )
      }

      // Get encoded transaction data
      const encodedTx = await sdk.getEncodedTransaction(safeTx)

      // Prepare the transaction to sign
      const nonce = await provider.getTransactionCount(signerAddress, 'pending')
      const feeData = await provider.getFeeData()
      const gasLimit = await provider.estimateGas({
        from: signerAddress,
        to: activeSafe.address,
        data: encodedTx,
      })

      // Create transaction object
      const txData = {
        chainId: BigInt(chain.chainId),
        to: activeSafe.address,
        data: encodedTx,
        nonce,
        gasLimit,
        maxFeePerGas: feeData.maxFeePerGas ?? undefined,
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas ?? undefined,
        value: 0n,
      }

      // Create unsigned transaction
      const transaction = Transaction.from(txData)

      // Convert to buffer for Ledger
      const unsignedTxBuffer = Buffer.from(transaction.unsignedSerialized.slice(2), 'hex')

      // Sign transaction with Ledger
      logger.info('Signing transaction with Ledger', { signerAddress, txId })
      const signatureHex = await ledgerEthereumService.signTransaction(session, derivationPath, unsignedTxBuffer)

      // Parse signature components (r, s, v)
      const signature = this.parseSignature(signatureHex)
      transaction.signature = signature

      // Send the signed transaction
      logger.info('Sending signed transaction', { txId })
      const txResponse = await provider.broadcastTransaction(transaction.serialized)

      logger.info('Transaction executed successfully', {
        signerAddress,
        txId,
        txHash: txResponse.hash,
      })

      return {
        hash: txResponse.hash,
      }
    } catch (error) {
      logger.error('Failed to execute Safe transaction with Ledger', {
        error,
        signerAddress,
        txId,
      })
      throw new Error(`Ledger execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Parse signature from hex string to ethers signature format
   */
  private parseSignature(signatureHex: string): { r: string; s: string; v: number } {
    // Remove 0x prefix if present
    const sig = signatureHex.startsWith('0x') ? signatureHex.slice(2) : signatureHex

    // Extract r, s, v from signature
    const r = '0x' + sig.slice(0, 64)
    const s = '0x' + sig.slice(64, 128)
    const v = parseInt(sig.slice(128, 130), 16)

    return { r, s, v }
  }
}

export const ledgerExecutionService = LedgerExecutionService.getInstance()
