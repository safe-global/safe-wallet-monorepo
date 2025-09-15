import { ethers } from 'ethers'
import type { Chain as ChainInfo } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import type { SafeTransaction } from '@safe-global/types-kit'
import type { TypedData } from '@ledgerhq/device-signer-kit-ethereum'
import { getTransactionDetails } from '@safe-global/safe-gateway-typescript-sdk'
import { TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'

import { ledgerDMKService } from './ledger-dmk.service'
import { ledgerEthereumService } from './ledger-ethereum.service'
import { createExistingTx } from '../tx/tx-sender/create'
import extractTxInfo from '../tx/extractTx'
import logger from '@/src/utils/logger'
import { SafeInfo } from '@/src/types/address'

export interface LedgerSafeSigningParams {
  chain: ChainInfo
  activeSafe: SafeInfo
  txId: string
  signerAddress: string
  derivationPath: string
}

export class LedgerSafeSigningService {
  private static instance: LedgerSafeSigningService

  private constructor() {
    // Private constructor for singleton pattern
  }

  public static getInstance(): LedgerSafeSigningService {
    if (!LedgerSafeSigningService.instance) {
      LedgerSafeSigningService.instance = new LedgerSafeSigningService()
    }
    return LedgerSafeSigningService.instance
  }

  /**
   * Sign a Safe transaction with Ledger device using EIP-712 structured data
   * @param params Signing parameters
   * @returns The signature and safe transaction hash
   */
  public async signSafeTransaction(params: LedgerSafeSigningParams): Promise<{
    signature: string
    safeTransactionHash: string
  }> {
    const { chain, activeSafe, txId, signerAddress, derivationPath } = params

    console.log('signSafeTransaction', params)
    try {
      // Get current Ledger session
      const session = ledgerDMKService.getCurrentSession()
      if (!session) {
        throw new Error('No active Ledger session found. Please connect your Ledger device.')
      }

      // Get the Safe transaction without requiring a private key (like web app does)
      const safeTx = await this.createSafeTransactionForLedger(activeSafe, txId)

      console.log('safeTx', safeTx)
      if (!safeTx) {
        throw new Error('Safe transaction not found')
      }

      // Create EIP-712 structured data for the Safe transaction
      const typedData = this.createSafeTransactionTypedData(safeTx, activeSafe, chain.chainId)
      console.log('Created typedData:', JSON.stringify(typedData, null, 2))

      // Get the transaction hash that will be signed
      const safeTransactionHash = await this.getSafeTransactionHash(safeTx, typedData)
      console.log('Safe transaction hash:', safeTransactionHash)

      // Sign the EIP-712 structured data with Ledger device
      console.log('Attempting to sign with Ledger, derivationPath:', derivationPath)
      const signature = await ledgerEthereumService.signTypedData(session, derivationPath, typedData)
      console.log('Received signature:', signature)

      logger.info('Successfully signed transaction with Ledger', {
        signerAddress,
        safeTransactionHash,
        txId,
      })

      return {
        signature,
        safeTransactionHash,
      }
    } catch (error) {
      logger.error('Failed to sign Safe transaction with Ledger', {
        error,
        signerAddress,
        txId,
      })
      throw new Error(`Ledger signing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Create Safe transaction without requiring a private key (following web app pattern)
   */
  private async createSafeTransactionForLedger(activeSafe: SafeInfo, txId: string): Promise<SafeTransaction> {
    // Get the tx details from the backend
    const txDetails = (await getTransactionDetails(activeSafe.chainId, txId)) as TransactionDetails

    // Convert them to the Core SDK tx params
    const { txParams, signatures } = extractTxInfo(txDetails, activeSafe.address)

    // Create a tx and add pre-approved signatures (no private key needed)
    const safeTx = await createExistingTx(txParams, signatures)

    return safeTx
  }

  /**
   * Create EIP-712 structured data for Safe transaction
   */
  private createSafeTransactionTypedData(safeTx: SafeTransaction, activeSafe: SafeInfo, chainId: string): TypedData {
    const domain = {
      chainId: parseInt(chainId),
      verifyingContract: activeSafe.address,
    }

    const types = {
      SafeTx: [
        { name: 'to', type: 'address' },
        { name: 'value', type: 'uint256' },
        { name: 'data', type: 'bytes' },
        { name: 'operation', type: 'uint8' },
        { name: 'safeTxGas', type: 'uint256' },
        { name: 'baseGas', type: 'uint256' },
        { name: 'gasPrice', type: 'uint256' },
        { name: 'gasToken', type: 'address' },
        { name: 'refundReceiver', type: 'address' },
        { name: 'nonce', type: 'uint256' },
      ],
    }

    const message = {
      to: safeTx.data.to,
      value: safeTx.data.value,
      data: safeTx.data.data,
      operation: safeTx.data.operation,
      safeTxGas: safeTx.data.safeTxGas,
      baseGas: safeTx.data.baseGas,
      gasPrice: safeTx.data.gasPrice,
      gasToken: safeTx.data.gasToken,
      refundReceiver: safeTx.data.refundReceiver,
      nonce: safeTx.data.nonce,
    }

    return {
      domain,
      types,
      primaryType: 'SafeTx',
      message,
    }
  }

  /**
   * Get the Safe transaction hash using EIP-712 hash calculation
   */
  private async getSafeTransactionHash(_safeTx: SafeTransaction, typedData: TypedData): Promise<string> {
    // Calculate the EIP-712 hash using ethers
    const hash = ethers.TypedDataEncoder.hash(typedData.domain, typedData.types, typedData.message)
    return hash
  }

  /**
   * Check if Ledger device is connected and ready
   */
  public isLedgerReady(): boolean {
    const session = ledgerDMKService.getCurrentSession()
    return session !== null
  }

  /**
   * Ensure Ledger device is connected
   */
  public async ensureLedgerConnection(): Promise<void> {
    if (!this.isLedgerReady()) {
      throw new Error('Ledger device not connected. Please connect your Ledger device and try again.')
    }
  }
}

export const ledgerSafeSigningService = LedgerSafeSigningService.getInstance()
