import type { Chain as ChainInfo } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import type { SafeTransaction, SafeVersion } from '@safe-global/types-kit'
import type { TypedData } from '@ledgerhq/device-signer-kit-ethereum'
import { getTransactionDetails } from '@safe-global/safe-gateway-typescript-sdk'
import { TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { generateTypedData } from '@safe-global/protocol-kit/dist/src/utils/eip-712'
import { TypedDataEncoder } from 'ethers'
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
  safeVersion: SafeVersion
}

export interface SigningResponse {
  signature: string
  safeTransactionHash: string
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
    const { chain, activeSafe, txId, signerAddress, derivationPath, safeVersion } = params

    try {
      // Get current Ledger session
      const session = ledgerDMKService.getCurrentSession()
      if (!session) {
        throw new Error('No active Ledger session found. Please connect your Ledger device.')
      }

      // Get the Safe transaction without requiring a private key (like web app does)
      const safeTx = await this.createSafeTransactionForLedger(activeSafe, txId)

      if (!safeTx) {
        throw new Error('Safe transaction not found')
      }

      // Use the protocol-kit's generateTypedData which handles all version differences automatically
      const typedData = generateTypedData({
        safeAddress: activeSafe.address,
        safeVersion,
        chainId: BigInt(chain.chainId),
        data: safeTx.data,
      })

      // Convert to Ledger-compatible format and get transaction hash
      const ledgerTypedData = this.convertToLedgerFormat(typedData)
      const safeTransactionHash = this.calculateTransactionHash(ledgerTypedData)

      // Sign the EIP-712 structured data with Ledger device
      const signature = await ledgerEthereumService.signTypedData(session, derivationPath, ledgerTypedData)

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
   * Convert protocol-kit's typed data format to Ledger-compatible format
   */
  private convertToLedgerFormat(typedData: ReturnType<typeof generateTypedData>): TypedData {
    // Remove EIP712Domain from types as it's handled by the domain field
    const typesObj = typedData.types as unknown as Record<string, unknown>
    const { EIP712Domain: _, ...types } = typesObj

    return {
      domain: {
        verifyingContract: typedData.domain.verifyingContract,
        ...(typedData.domain.chainId && { chainId: Number(typedData.domain.chainId) }),
      },
      types: types as Record<string, { name: string; type: string }[]>,
      primaryType: typedData.primaryType,
      message: typedData.message,
    }
  }

  /**
   * Calculate the Safe transaction hash from typed data
   */
  private calculateTransactionHash(typedData: TypedData): string {
    return TypedDataEncoder.hash(typedData.domain, typedData.types, typedData.message)
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
