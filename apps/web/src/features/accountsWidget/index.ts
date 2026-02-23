import { createFeatureHandle } from '@/features/__core__'
import type { AccountsWidgetContract } from './contract'
import { FEATURES } from '@safe-global/utils/utils/chains'

export const AccountsWidgetFeature = createFeatureHandle<AccountsWidgetContract>('accountsWidget', FEATURES.SPACES)
export type { AccountsWidgetContract } from './contract'
export { default as useSpaceAccountsData } from './hooks/useSpaceAccountsData'
export type * from './types'
