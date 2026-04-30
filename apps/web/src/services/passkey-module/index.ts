import { type WalletInit, createEIP1193Provider } from '@web3-onboard/common'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { JsonRpcProvider } from 'ethers'
import { getRpcServiceUrl } from '@/hooks/wallets/web3'
import { resolveIdentityForChain, type PasskeyMetadata } from '@safe-global/utils/services/passkey'
import { PASSKEY_MODULE_LABEL } from './constants'
import passkeyPopupStore, { getActivePasskey, webPasskeyStorage } from './passkey-store'
import { numberToHex } from '@/utils/hex'

export { PASSKEY_MODULE_LABEL }

let currentChainId = ''
let currentRpcUri = ''

/**
 * Resolves the active passkey for this browser. POC: web has no automatic
 * cross-device discovery yet (largeBlob doesn't sync via iCloud — see
 * `docs/brainstorms/2026-04-27-passkey-coordinate-storage-api-rfc.md` for
 * the planned CGW-backed solution). Falls back to a manual-import popup.
 */
async function resolvePasskey(): Promise<PasskeyMetadata> {
  const stored = getActivePasskey()
  if (stored) return stored

  passkeyPopupStore.setStore({ isOpen: true, data: null })
  return new Promise<PasskeyMetadata>((resolve, reject) => {
    const unsubscribe = passkeyPopupStore.subscribe(() => {
      const store = passkeyPopupStore.getStore()
      if (store?.isOpen) return
      unsubscribe()
      if (store?.data) {
        resolve(store.data)
      } else {
        reject(new Error('Passkey connection cancelled'))
      }
    })
  })
}

const PasskeyModule = (chainId: Chain['chainId'], rpcUri: Chain['rpcUri']): WalletInit => {
  currentChainId = chainId
  currentRpcUri = getRpcServiceUrl(rpcUri as Parameters<typeof getRpcServiceUrl>[0])

  return () => ({
    label: PASSKEY_MODULE_LABEL,
    getIcon: async () => (await import('./icon')).default,
    getInterface: async () => {
      const passkey = await resolvePasskey()
      // Resolve the proxy address for the current chain (different chains
      // produce different CREATE2 addresses because the verifier is per-chain).
      // Cache the derivation back into storage so future signs skip the view call.
      const identityContractAddress = await resolveIdentityForChain({
        rpcUrl: currentRpcUri,
        chainId: currentChainId,
        passkey,
      })
      if (!passkey.identityContractAddresses[currentChainId]) {
        await webPasskeyStorage.setIdentityForChain(passkey.rawId, currentChainId, identityContractAddress)
      }

      let provider: JsonRpcProvider
      const chainChangedListeners = new Set<(chainId: string) => void>()

      const updateProvider = () => {
        provider?.destroy()
        provider = new JsonRpcProvider(currentRpcUri, Number(currentChainId), { staticNetwork: true })
        setTimeout(() => {
          chainChangedListeners.forEach((listener) => listener(numberToHex(Number(currentChainId))))
        }, 100)
      }

      updateProvider()

      return {
        provider: createEIP1193Provider(
          {
            on: (event: string, listener: (...args: unknown[]) => void) => {
              if (event === 'accountsChanged') return
              if (event === 'chainChanged') {
                chainChangedListeners.add(listener)
                return
              }
              provider.on(event, listener)
            },
            request: async (request: { method: string; params: unknown[] }) =>
              provider.send(request.method, request.params),
            disconnect: () => {},
          },
          {
            eth_chainId: async () => currentChainId,
            // @ts-ignore
            eth_accounts: async () => [identityContractAddress],
            // @ts-ignore
            eth_requestAccounts: async () => [identityContractAddress],
            eth_getCode: async ({ params }: { params: unknown[] }) =>
              provider.getCode(params[0] as string, params[1] as string),
            // @ts-ignore
            personal_sign: async () => {
              throw new Error('Passkey signing must go through the Safe SDK passkey path')
            },
            // @ts-ignore
            eth_signTypedData: async () => {
              throw new Error('Passkey signing must go through the Safe SDK passkey path')
            },
            // @ts-ignore
            eth_signTypedData_v4: async () => {
              throw new Error('Passkey signing must go through the Safe SDK passkey path')
            },
            // @ts-ignore
            wallet_switchEthereumChain: async () => {
              updateProvider()
            },
          },
        ),
      }
    },
    platforms: ['desktop'],
  })
}

export default PasskeyModule
