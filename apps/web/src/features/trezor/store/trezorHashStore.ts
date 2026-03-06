import ExternalStore from '@safe-global/utils/services/ExternalStore'
import type { TrezorHashState } from '../types'

// External store for Trezor hash comparison
const trezorHashStore = new ExternalStore<TrezorHashState>(undefined)

export const showTrezorHashComparison = (hash: string) => {
  trezorHashStore.setStore(hash)
}

export const hideTrezorHashComparison = () => {
  trezorHashStore.setStore(undefined)
}

export default trezorHashStore
