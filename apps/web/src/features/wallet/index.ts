import { createFeatureHandle } from '@/features/__core__'
import type { WalletContract } from './contract'

export const WalletFeature = createFeatureHandle<WalletContract>('wallet')

export { default as useWalletPopover } from './hooks/useWalletPopover'

export type * from './types'
