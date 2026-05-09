import { getAddress } from 'viem'
import type { EthereumSignTypedDataMessage, EthereumSignTypedDataTypes } from '@trezor/connect-web'
import type { ResolvedAddress, TrezorTransaction } from './types'
import { mapTrezorError } from './errors'

// Module-level guard — TrezorConnect.init() throws Init_AlreadyInitialized on second call
let trezorConnectInitialized = false

export async function getTrezorSdk() {
  const { default: TrezorConnect } = await import('@trezor/connect-web')
  const { TREZOR_APP_URL, TREZOR_EMAIL } = await import('@/config/constants')

  if (!trezorConnectInitialized) {
    await TrezorConnect.init({
      manifest: { appName: 'Safe{Wallet}', appUrl: TREZOR_APP_URL, email: TREZOR_EMAIL },
      lazyLoad: true,
      coreMode: 'popup',
    })
    trezorConnectInitialized = true
  }

  return {
    disconnect: async (): Promise<void> => {
      TrezorConnect.dispose()
      trezorConnectInitialized = false
    },

    getAddresses: async (paths: string[]): Promise<ResolvedAddress[]> => {
      const result = await TrezorConnect.ethereumGetAddress({
        bundle: paths.map((path) => ({ path, showOnTrezor: false })),
      })
      if (!result.success) throw mapTrezorError(result.payload)
      return result.payload.map((item) => ({ address: getAddress(item.address), path: item.serializedPath }))
    },

    signMessage: async (derivationPath: string, message: string): Promise<string> => {
      // Trezor expects the raw hex bytes without the 0x prefix when hex: true
      const hex = message.startsWith('0x') ? message.slice(2) : message
      const result = await TrezorConnect.ethereumSignMessage({ path: derivationPath, message: hex, hex: true })
      if (!result.success) throw mapTrezorError(result.payload)
      const sig = result.payload.signature
      // Trezor returns raw hex without 0x; ethers Signature.from() requires the prefix
      return sig.startsWith('0x') ? sig : `0x${sig}`
    },

    signTransaction: async (
      derivationPath: string,
      transaction: TrezorTransaction,
    ): Promise<{ serializedTx: string }> => {
      const result = await TrezorConnect.ethereumSignTransaction({
        path: derivationPath,
        transaction,
      })
      if (!result.success) throw mapTrezorError(result.payload)
      return result.payload
    },

    signTypedData: async (
      derivationPath: string,
      data: EthereumSignTypedDataMessage<EthereumSignTypedDataTypes>,
      domainSeparatorHash: string,
      messageHash?: string,
    ): Promise<string> => {
      const result = await TrezorConnect.ethereumSignTypedData({
        path: derivationPath,
        data,
        metamask_v4_compat: true,
        domain_separator_hash: domainSeparatorHash,
        ...(messageHash != null && { message_hash: messageHash }),
      })
      if (!result.success) throw mapTrezorError(result.payload)
      const typedSig = result.payload.signature
      // Trezor returns raw hex without 0x; ethers Signature.from() requires the prefix
      return typedSig.startsWith('0x') ? typedSig : `0x${typedSig}`
    },
  }
}
