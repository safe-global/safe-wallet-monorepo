import type { Balance } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import type { EARN_LABELS } from '@/services/analytics/events/earn'

export interface EarnButtonProps {
  tokenInfo: Balance['tokenInfo']
  trackingLabel: EARN_LABELS
  compact?: boolean
  onlyIcon?: boolean
}
