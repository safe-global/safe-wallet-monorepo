import type { ReactElement } from 'react'
import { maybePlural } from '@safe-global/utils/utils/formatters'
import TokenIcon from '@/components/common/TokenIcon'
import { DrawerSection } from '@/components/common/Drawer'
import { Card } from '@safe-global/views/components/ui/card'
import { Typography } from '@safe-global/views/components/ui/typography'
import { cn } from '@safe-global/views/utils/cn'
import type { AllowlistChanges } from '@safe-global/views/features/spaces/components/Policies/types'
import ExpandableCard from './ExpandableCard'
import ChangeBadge from './ChangeBadge'

const PREVIEW_COUNT = 3

export type AllowlistTokensProps = {
  /** Resulting tokens first; an edit appends the ones it removes. */
  tokens: AllowlistChanges['tokens']
  isRemoved?: boolean
}

const AllowlistTokens = ({ tokens, isRemoved = false }: AllowlistTokensProps): ReactElement => {
  const remaining = tokens.filter(({ change }) => change !== 'removed')

  return (
    <DrawerSection title="Which tokens can be sent">
      <ExpandableCard
        detailsLabel="token details"
        defaultOpen={tokens.some(({ change }) => change)}
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
              {remaining.length} token{maybePlural(remaining)}
            </Typography>
            {isRemoved && <ChangeBadge change="removed" />}
          </>
        }
      >
        {tokens.map((token) => {
          const shownChange = isRemoved ? 'removed' : token.change

          return (
            <Card key={token.address} variant="muted" size="none" radius="lg" data-testid="allowlist-token">
              <div className="flex items-center gap-3 p-3">
                <TokenIcon logoUri={token.logoUri ?? undefined} tokenSymbol={token.symbol} size={24} />
                <Typography
                  variant="paragraph-small-medium"
                  className={cn(
                    'min-w-0 flex-1 truncate',
                    shownChange === 'removed' && 'text-muted-foreground line-through',
                  )}
                >
                  {token.symbol}
                </Typography>
                {shownChange && <ChangeBadge change={shownChange} alignWithChevron />}
              </div>
            </Card>
          )
        })}
      </ExpandableCard>
    </DrawerSection>
  )
}

export default AllowlistTokens
