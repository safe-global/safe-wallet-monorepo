/**
 * Lightweight module for web3 stores and hooks.
 * Does NOT import ethers - safe to use in the main bundle.
 * For provider creation functions, import from './web3' instead.
 */
import type { JsonRpcProvider, BrowserProvider } from 'ethers'
import ExternalStore from '@safe-global/utils/services/ExternalStore'

export const { setStore: setWeb3, useStore: useWeb3 } = new ExternalStore<BrowserProvider>()

export const {
  getStore: getWeb3ReadOnly,
  setStore: setWeb3ReadOnly,
  useStore: useWeb3ReadOnly,
} = new ExternalStore<JsonRpcProvider>()
