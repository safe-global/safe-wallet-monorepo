import type { ReactElement } from 'react'
import EthHashInfo from '@/components/common/EthHashInfo'
import { Card } from '@/components/ui/card'
import LimitSummaryRow from './LimitSummaryRow'
import SummaryField from './SummaryField'
import { Badge } from '@/components/ui/badge'
import { CHANGE_BADGE } from './constants'
import { LIMITS_LABEL, SPENDER_LABEL } from './constants'
import type { SpenderSummary } from './types'

const AVATAR_SIZE = 24

type SpenderSummaryCardProps = {
  spender: SpenderSummary
  /** The Safe's chain: address-book lookup and reset-period wording key off it. */
  chainId: string
}

const SpenderSummaryCard = ({ spender, chainId }: SpenderSummaryCardProps): ReactElement => (
  <Card variant="muted" size="none" radius="lg" data-testid="spending-limit-summary-spender">
    <div className="flex flex-col gap-4 p-3">
      <SummaryField label={SPENDER_LABEL}>
        {spender.change && (
          <Badge
            variant={CHANGE_BADGE[spender.change].variant}
            className="w-fit"
            data-testid={`spender-change-${spender.change}`}
          >
            {CHANGE_BADGE[spender.change].label}
          </Badge>
        )}
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

      <SummaryField label={LIMITS_LABEL}>
        {spender.limits.map((limit, index) => (
          <LimitSummaryRow key={`${limit.token.address}-${index}`} limit={limit} chainId={chainId} />
        ))}
      </SummaryField>
    </div>
  </Card>
)

export default SpenderSummaryCard
