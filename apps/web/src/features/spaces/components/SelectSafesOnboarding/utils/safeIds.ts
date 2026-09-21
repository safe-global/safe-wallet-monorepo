import type { SafeItem, MultiChainSafeItem } from '@/hooks/safes'
import { MULTICHAIN_SAFE_KEY_PREFIX } from '../constants'

/** Form key for a single-chain safe (also the leaf key for a multi-chain child). */
export const getSafeId = (safeItem: Pick<SafeItem, 'chainId' | 'address'>) => `${safeItem.chainId}:${safeItem.address}`

/** Form key for a multi-chain parent — a UI grouping only, never sent to the backend. */
export const getMultiChainSafeId = (mcSafe: Pick<MultiChainSafeItem, 'address'>) =>
  `${MULTICHAIN_SAFE_KEY_PREFIX}${mcSafe.address}`
