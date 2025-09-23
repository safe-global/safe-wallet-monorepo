import { SignerEthBuilder } from '@ledgerhq/device-signer-kit-ethereum'
import type { DeviceSessionId, ExecuteDeviceActionReturnType } from '@ledgerhq/device-management-kit'
import type { TypedData, Signature } from '@ledgerhq/device-signer-kit-ethereum'
import { ledgerDMKService } from './ledger-dmk.service'
import logger from '@/src/utils/logger'

export interface EthereumAddress {
  address: string
  path: string
  index: number
}

export class LedgerEthereumService {
  private static instance: LedgerEthereumService

  private constructor() {
    // Private constructor for singleton pattern
  }

  /**
   * Create a SignerEth instance for the given session
   * @param session The device session
   * @returns The SignerEth instance
   */
  private createSigner(session: DeviceSessionId) {
    return new SignerEthBuilder({
      dmk: ledgerDMKService['dmk'], // Access private dmk instance
      sessionId: session,
      originToken: 'safe.global',
    }).build()
  }

  /**
   * Execute any device action and return a promise with proper typing
   * @param deviceAction The device action return type from Ledger SDK
   * @returns Promise that resolves with the action output
   */
  private executeDeviceAction<T, E, I>(deviceAction: ExecuteDeviceActionReturnType<T, E, I>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      deviceAction.observable.subscribe({
        next: (state) => {
          if (state.status === 'completed' && state.output) {
            resolve(state.output)
          } else if (state.status === 'error') {
            reject(state.error || new Error('Device action failed'))
          }
          // For pending states, we just wait
        },
        error: (error) => {
          reject(error instanceof Error ? error : new Error('Device action failed'))
        },
      })
    })
  }

  /**
   * Format signature components into a hex string
   * @param signature The signature components from Ledger SDK
   * @returns Formatted signature string
   */
  private formatSignature(signature: Signature): string {
    const r = signature.r.startsWith('0x') ? signature.r.slice(2) : signature.r
    const s = signature.s.startsWith('0x') ? signature.s.slice(2) : signature.s
    const v = signature.v.toString(16).padStart(2, '0')
    return `0x${r}${s}${v}`
  }

  public static getInstance(): LedgerEthereumService {
    if (!LedgerEthereumService.instance) {
      LedgerEthereumService.instance = new LedgerEthereumService()
    }
    return LedgerEthereumService.instance
  }

  /**
   * Get Ethereum addresses from the connected Ledger device
   * @param session The device session
   * @param count Number of addresses to retrieve (default: 10)
   * @param startIndex Starting index for address derivation (default: 0)
   * @returns Array of Ethereum addresses with their derivation paths
   */
  public async getEthereumAddresses(session: DeviceSessionId, count = 10, startIndex = 0): Promise<EthereumAddress[]> {
    const signerEth = this.createSigner(session)
    const addresses: EthereumAddress[] = []

    // Derive addresses using the standard Ethereum derivation path
    for (let i = startIndex; i < startIndex + count; i++) {
      const path = `44'/60'/0'/0/${i}` // Standard Ethereum derivation path

      try {
        const deviceAction = signerEth.getAddress(path)
        const addressResult = await this.executeDeviceAction(deviceAction)

        if (addressResult && addressResult.address) {
          addresses.push({
            address: addressResult.address,
            path,
            index: i,
          })
        }
      } catch (error) {
        logger.error(`Failed to get address at index ${i}:`, error)
        // Continue with next address instead of failing completely
        continue
      }
    }

    return addresses
  }

  /**
   * Get a single Ethereum address by index
   * @param session The device session
   * @param index The address index
   * @returns Single Ethereum address with its derivation path
   */
  public async getEthereumAddress(session: DeviceSessionId, index: number): Promise<EthereumAddress> {
    const addresses = await this.getEthereumAddresses(session, 1, index)
    if (addresses.length === 0) {
      throw new Error(`Failed to retrieve address at index ${index}`)
    }
    return addresses[0]
  }

  /**
   * Sign a transaction with the Ledger device
   * @param session The device session
   * @param path The derivation path
   * @param transaction The transaction data to sign
   * @returns The signature
   */
  public async signTransaction(session: DeviceSessionId, path: string, transaction: Uint8Array): Promise<string> {
    try {
      const signerEth = this.createSigner(session)
      const deviceAction = signerEth.signTransaction(path, transaction)
      const signatureResult = await this.executeDeviceAction(deviceAction)

      return this.formatSignature(signatureResult)
    } catch (error) {
      throw new Error(`Failed to sign transaction: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Sign EIP-712 typed data with the Ledger device
   * @param session The device session
   * @param path The derivation path
   * @param typedData The EIP-712 structured data to sign
   * @returns The signature
   */
  public async signTypedData(session: DeviceSessionId, path: string, typedData: TypedData): Promise<string> {
    try {
      const signerEth = this.createSigner(session)
      const deviceAction = signerEth.signTypedData(path, typedData)
      const signatureResult = await this.executeDeviceAction(deviceAction)

      return this.formatSignature(signatureResult)
    } catch (error) {
      throw new Error(`Failed to sign typed data: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}

export const ledgerEthereumService = LedgerEthereumService.getInstance()
