import dynamic from '@/utils/dynamic'

export type { EarnButtonProps } from './types'

export { useIsEarnFeatureEnabled, useIsEarnPromoEnabled } from '@/features/earn/hooks/useIsEarnFeatureEnabled'

export { default as EarnButton } from '@/features/earn/components/EarnButton'

export { isEligibleEarnToken } from '@/features/earn/services/utils'

export { EARN_TITLE } from './constants'

// Vault transaction components (used by external transaction flow components)
export { default as VaultDepositTxDetails } from '@/features/earn/components/VaultDepositTxDetails'
export { default as VaultRedeemTxDetails } from '@/features/earn/components/VaultRedeemTxDetails'
export { default as VaultDepositTxInfo } from '@/features/earn/components/VaultDepositTxInfo'
export { default as VaultRedeemTxInfo } from '@/features/earn/components/VaultRedeemTxInfo'
export { default as VaultDepositConfirmation } from '@/features/earn/components/VaultDepositConfirmation'
export { default as VaultRedeemConfirmation } from '@/features/earn/components/VaultRedeemConfirmation'

const EarnPage = dynamic(() => import('./components/EarnPage').then((mod) => ({ default: mod.default })), {
  ssr: false,
})

export default EarnPage
