import type { ReactElement } from 'react'
import { maybePlural } from '@safe-global/utils/utils/formatters'
import TokenIcon from '@/components/common/TokenIcon'
import { DrawerSection } from '@/components/common/Drawer'
import { Card } from '@safe-global/views/components/ui/card'
import { Typography } from '@safe-global/views/components/ui/typography'
import { cn } from '@safe-global/views/utils/cn'
import type { PolicyTokenInfo } from '@safe-global/views/features/spaces/components/Policies/types'
import ExpandableCard from './ExpandableCard'
import RemovedBadge from './RemovedBadge'

const PREVIEW_COUNT = 3

export type AllowlistTokensProps = {
  tokens: PolicyTokenInfo[]
  isRemoved?: boolean
}

const AllowlistTokens = ({ tokens, isRemoved = false }: AllowlistTokensProps): ReactElement => (
  <DrawerSection title="Which tokens can be sent">
    <ExpandableCard
      detailsLabel="token details"
      summary={
        <>
          <span className="flex shrink-0 -space-x-2">
            {tokens.slice(0, PREVIEW_COUNT).map((token) => (
              <span key={token.address} className="rounded-full ring-2 ring-muted">
                <TokenIcon logoUri={token.logoUri ?? undefined} tokenSymbol={token.symbol} size={24} />
              </span>
            ))}
          </span>
          <Typography variant="paragraph-small-medium" className="min-w-0 flex-1 truncate">
            {tokens.length} token{maybePlural(tokens)}
          </Typography>
          {isRemoved && <RemovedBadge />}
        </>
      }
    >
      {tokens.map((token) => (
        <Card key={token.address} variant="muted" size="none" radius="lg" data-testid="allowlist-token">
          <div className="flex items-center gap-3 p-3">
            <TokenIcon logoUri={token.logoUri ?? undefined} tokenSymbol={token.symbol} size={24} />
            <Typography
              variant="paragraph-small-medium"
              className={cn('min-w-0 flex-1 truncate', isRemoved && 'text-muted-foreground line-through')}
            >
              {token.symbol}
            </Typography>
            {isRemoved && <RemovedBadge alignWithChevron />}
          </div>
        </Card>
      ))}
    </ExpandableCard>
  </DrawerSection>
)

export default AllowlistTokens
