import { JsonRpcProvider, Wallet } from 'ethers'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { type WalletInit, createEIP1193Provider } from '@web3-onboard/common'
import { getRpcServiceUrl } from '@/hooks/wallets/web3'
import pkPopupStore from './pk-popup-store'
import { numberToHex } from '@/utils/hex'

import { PRIVATE_KEY_MODULE_LABEL } from './constants'
export { PRIVATE_KEY_MODULE_LABEL }

async function getPrivateKey() {
  const savedKey = pkPopupStore.getStore()?.privateKey
  if (savedKey) return savedKey

  pkPopupStore.setStore({
    isOpen: true,
    privateKey: '',
  })

  return new Promise<string>((resolve) => {
    const unsubscribe = pkPopupStore.subscribe(() => {
      unsubscribe()
      resolve(pkPopupStore.getStore()?.privateKey ?? '')
    })
  })
}

let currentChainId = ''
let currentRpcUri = ''

const PrivateKeyModule = (chainId: Chain['chainId'], rpcUri: Chain['rpcUri']): WalletInit => {
  currentChainId = chainId
  currentRpcUri = getRpcServiceUrl(rpcUri as any)

  return () => {
    return {
      label: PRIVATE_KEY_MODULE_LABEL,
      getIcon: async () => (await import('./icon')).default,
      getInterface: async () => {
        const privateKey = await getPrivateKey()
        if (!privateKey) {
          throw new Error('You rejected the connection')
        }

        let provider: JsonRpcProvider
        let wallet: Wallet
        const chainChangedListeners = new Set<(chainId: string) => void>()

        const updateProvider = () => {
          console.log('[Private key signer] Updating provider to chainId', currentChainId, currentRpcUri)
          provider?.destroy()
          provider = new JsonRpcProvider(currentRpcUri, Number(currentChainId), { staticNetwork: true })
          wallet = new Wallet(privateKey, provider)

          setTimeout(() => {
            chainChangedListeners.forEach((listener) => listener(numberToHex(Number(currentChainId))))
          }, 100)
        }

        updateProvider()

        return {
          provider: createEIP1193Provider(
            {
              on: (event: string, listener: (...args: any[]) => void) => {
                if (event === 'accountsChanged') {
                  return
                } else if (event === 'chainChanged') {
                  chainChangedListeners.add(listener)
                } else {
                  provider.on(event, listener)
                }
              },

              request: async (request: { method: string; params: any[] }) => {
                return provider.send(request.method, request.params)
              },

              disconnect: () => {
                pkPopupStore.setStore({
                  isOpen: false,
                  privateKey: '',
                })
              },
            },
            {
              eth_chainId: async () => currentChainId,

              // @ts-ignore
              eth_getCode: async ({ params }) => provider.getCode(params[0], params[1]),
              // @ts-ignore
              eth_accounts: async () => [wallet.address],
              // @ts-ignore
              eth_requestAccounts: async () => [wallet.address],

              eth_call: async ({ params }: { params: any }) => wallet.call(params[0]),

              eth_sendTransaction: async ({ params }) => {
                const tx = await wallet.sendTransaction(params[0] as any)
                return tx.hash // return transaction hash
              },

              personal_sign: async ({ params }) => {
                return wallet.signMessage(params[0])
              },

              eth_signTypedData: async ({ params }) => {
                const [, typedData] = params
                return await wallet.signTypedData(
                  typedData.domain,
                  { [typedData.primaryType]: typedData.types[typedData.primaryType] },
                  typedData.message,
                )
              },

              // @ts-ignore
              eth_signTypedData_v4: async ({ params }) => {
                const [, typedData] = params

                let parsedTypedData
                try {
                  parsedTypedData = JSON.parse(typedData)
                } catch (error: unknown) {
                  if (error instanceof Error) {
                    throw new Error('Failed to parse typedData: ' + error.message)
                  } else {
                    throw new Error('Failed to parse typedData: Unknown error')
                  }
                }

                if (!parsedTypedData || !parsedTypedData.domain || !parsedTypedData.types || !parsedTypedData.message) {
                  throw new Error('Invalid parameters for eth_signTypedData_v4')
                }

                return await wallet.signTypedData(
                  parsedTypedData.domain,
                  { [parsedTypedData.primaryType]: parsedTypedData.types[parsedTypedData.primaryType] },
                  parsedTypedData.message,
                )
              },

              // @ts-ignore
              wallet_switchEthereumChain: async ({ params }) => {
                console.log('[Private key signer] Switching chain', params)
                updateProvider()
              },
            },
          ),
        }
      },
      platforms: ['desktop'],
    }
  }
}

export default PrivateKeyModule
