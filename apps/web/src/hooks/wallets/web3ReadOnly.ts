/**
 * Lightweight module for web3 stores and hooks.
 * Does NOT import ethers - safe to use in the main bundle.
 * For provider creation functions, import from './web3' instead.
 */
import type { JsonRpcProvider, BrowserProvider } from 'ethers'
import ExternalStore from '@safe-global/utils/services/ExternalStore'
// Imported from `context` directly so this always-loaded module depends on nothing but the React context.
import { useSafeScope } from '@/components/tx-flow/safe-scope/context'

export const { setStore: setWeb3, useStore: useWeb3 } = new ExternalStore<BrowserProvider>()

const web3ReadOnlyStore = new ExternalStore<JsonRpcProvider>()

export const getWeb3ReadOnly = web3ReadOnlyStore.getStore
export const setWeb3ReadOnly = web3ReadOnlyStore.setStore

/** The URL-chain provider, or the scoped chain's provider inside a Space-level flow. */
export const useWeb3ReadOnly = (): JsonRpcProvider | undefined => {
  const scope = useSafeScope()
  const urlChainWeb3 = web3ReadOnlyStore.useStore()
  return scope ? scope.web3ReadOnly : urlChainWeb3
}
