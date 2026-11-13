import dynamic from '@/utils/dynamic'

export type { EarnButtonProps } from './types'

export { useIsEarnFeatureEnabled, useIsEarnPromoEnabled } from './hooks'

export { EarnButton } from './components'

export { isEligibleEarnToken } from './services'

export { EARN_TITLE } from './constants'

export { DefiV1Context, useDefiV1 } from './defiV1/context'
export { IdleCashNudge } from './defiV1/components/IdleCashNudge'
export type { DefiV1Config } from './defiV1/types'

// Vault transaction components (used by external transaction flow components)
export {
  VaultDepositTxDetails,
  VaultRedeemTxDetails,
  VaultDepositTxInfo,
  VaultRedeemTxInfo,
  VaultDepositConfirmation,
  VaultRedeemConfirmation,
} from './components'

const EarnPage = dynamic(() => import('./components/EarnPage').then((mod) => ({ default: mod.default })), {
  ssr: false,
})

export default EarnPage
