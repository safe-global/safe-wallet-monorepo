import ExternalStore from '@safe-global/utils/services/ExternalStore'
import type { WcChainSwitchRequest } from '../types'

export const wcChainSwitchStore = new ExternalStore<WcChainSwitchRequest | undefined>(undefined)
