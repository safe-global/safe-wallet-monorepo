import type { ReactElement, ReactNode } from 'react'
import EthHashInfo from '@/components/common/EthHashInfo'
import { Card } from '@/components/ui/card'
import SummaryField from './SummaryField'
import { LIMITS_LABEL, SPENDER_LABEL } from './constants'
import type { SpenderSummary } from './types'

const AVATAR_SIZE = 24

export type SpenderSummaryCardViewProps = {
  spender: SpenderSummary
  chainId: string
  limits: ReactNode
}

export const SpenderSummaryCardView = ({ spender, chainId, limits }: SpenderSummaryCardViewProps): ReactElement => (
  <Card variant="muted" size="none" radius="lg" data-testid="spending-limit-summary-spender">
    <div className="flex flex-col gap-4 p-3">
      <SummaryField label={SPENDER_LABEL}>
        <EthHashInfo
          address={spender.address}
          name={spender.name}
          chainId={chainId}
          showAvatar
          avatarSize={AVATAR_SIZE}
          shortAddress={false}
          showPrefix={false}
          highlight4bytes
          showCopyButton
        />
      </SummaryField>

      <SummaryField label={LIMITS_LABEL}>{limits}</SummaryField>
    </div>
  </Card>
)
