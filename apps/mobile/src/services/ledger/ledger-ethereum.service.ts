import { SignerEthBuilder } from '@ledgerhq/device-signer-kit-ethereum'
import type { DeviceSessionId } from '@ledgerhq/device-management-kit'
import type { TypedData } from '@ledgerhq/device-signer-kit-ethereum'
import { ledgerDMKService } from './ledger-dmk.service'

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
    // try {
    // Create the Ethereum signer using the session
    const signerEth = new SignerEthBuilder({
      dmk: ledgerDMKService['dmk'], // Access private dmk instance
      sessionId: session,
      originToken: 'safe.global',
    }).build()

    const addresses: EthereumAddress[] = []

    // Derive addresses using the standard Ethereum derivation path
    for (let i = startIndex; i < startIndex + count; i++) {
      console.log('i', i)
      const path = `44'/60'/0'/0/${i}` // Standard Ethereum derivation path

      try {
        // The getAddress method returns an Observable-based device action
        const addressResult = await new Promise<{ address: string; publicKey: string }>((resolve, reject) => {
          const { observable } = signerEth.getAddress(path)

          console.log('observable', observable)
          observable.subscribe({
            next: (state) => {
              console.log(`Address ${i} state:`, state)
              // Handle different states of the device action
              if (state.status === 'completed') {
                resolve(state.output)
              } else if (state.status === 'error') {
                reject(state.error)
              }
              // For pending states, we just wait
            },
            error: (error) => {
              reject(error)
            },
          })
        })

        console.log(`Address result for ${i}:`, addressResult)

        if (addressResult && addressResult.address) {
          addresses.push({
            address: addressResult.address,
            path,
            index: i,
          })
        }
      } catch (error) {
        console.error(`Failed to get address at index ${i}:`, error)
        // Continue with next address instead of failing completely
        continue
      }
    }

    return addresses
    // } catch (error) {
    //   throw new Error(
    //     `Failed to retrieve Ethereum addresses: ${error instanceof Error ? error.message : 'Unknown error'}`,
    //   )
    // }
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
      const signerEth = new SignerEthBuilder({
        dmk: ledgerDMKService['dmk'], // Access private dmk instance
        sessionId: session,
        originToken: 'safe.global',
      }).build()

      // The signTransaction method returns an Observable-based device action
      const signatureResult = await new Promise<{ r: string; s: string; v: number }>((resolve, reject) => {
        const { observable } = signerEth.signTransaction(path, transaction)

        observable.subscribe({
          next: (state) => {
            console.log('Sign transaction state:', state)
            // Handle different states of the device action
            if (state.status === 'completed') {
              resolve(state.output)
            } else if (state.status === 'error') {
              reject(state.error)
            }
            // For pending states, we just wait
          },
          error: (error) => {
            reject(error)
          },
        })
      })

      // Convert signature to proper format (remove 0x prefixes from components)
      const r = signatureResult.r.startsWith('0x') ? signatureResult.r.slice(2) : signatureResult.r
      const s = signatureResult.s.startsWith('0x') ? signatureResult.s.slice(2) : signatureResult.s
      const v = signatureResult.v.toString(16).padStart(2, '0')
      return `0x${r}${s}${v}`
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
      const signerEth = new SignerEthBuilder({
        dmk: ledgerDMKService['dmk'], // Access private dmk instance
        sessionId: session,
        originToken: 'safe.global',
      }).build()

      // The signTypedData method returns an Observable-based device action
      const signatureResult = await new Promise<{ r: string; s: string; v: number }>((resolve, reject) => {
        const { observable } = signerEth.signTypedData(path, typedData)

        observable.subscribe({
          next: (state) => {
            console.log('Sign typed data state:', state)
            // Handle different states of the device action
            if (state.status === 'completed') {
              resolve(state.output)
            } else if (state.status === 'error') {
              reject(state.error)
            }
            // For pending states, we just wait
          },
          error: (error) => {
            reject(error)
          },
        })
      })

      // Convert signature to proper format (remove 0x prefixes from components)
      const r = signatureResult.r.startsWith('0x') ? signatureResult.r.slice(2) : signatureResult.r
      const s = signatureResult.s.startsWith('0x') ? signatureResult.s.slice(2) : signatureResult.s
      const v = signatureResult.v.toString(16).padStart(2, '0')
      return `0x${r}${s}${v}`
    } catch (error) {
      throw new Error(`Failed to sign typed data: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}

export const ledgerEthereumService = LedgerEthereumService.getInstance()
