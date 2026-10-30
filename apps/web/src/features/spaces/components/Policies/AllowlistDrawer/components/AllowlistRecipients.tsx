import type { ReactElement } from 'react'
import { blo } from 'blo'
import { maybePlural } from '@safe-global/utils/utils/formatters'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { DrawerSection } from '@/components/common/Drawer'
import { Avatar, AvatarImage } from '@safe-global/views/components/ui/avatar'
import { Card } from '@safe-global/views/components/ui/card'
import { Typography } from '@safe-global/views/components/ui/typography'
import { cn } from '@safe-global/views/utils/cn'
import type { AllowlistChanges } from '@safe-global/views/features/spaces/components/Policies/types'
import { AccountIdentity } from '../../components/AccountIdentity'
import ExpandableCard from './ExpandableCard'
import ChangeBadge from './ChangeBadge'

const PREVIEW_COUNT = 3

export type AllowlistRecipientsProps = {
  /** Resulting recipients first; an edit appends the ones it removes. */
  recipients: AllowlistChanges['recipients']
  /** Address book names keyed by address, in any casing. The real map arrives with the CGW wiring. */
  names?: Record<string, string>
  isRemoved?: boolean
}

const findName = (names: AllowlistRecipientsProps['names'], address: string): string | undefined =>
  Object.entries(names ?? {}).find(([key]) => sameAddress(key, address))?.[1]

const AllowlistRecipients = ({ recipients, names, isRemoved = false }: AllowlistRecipientsProps): ReactElement => {
  const remaining = recipients.filter(({ change }) => change !== 'removed')

  return (
    <DrawerSection title="Who can receive funds">
      <ExpandableCard
        detailsLabel="recipient details"
        defaultOpen={recipients.some(({ change }) => change)}
        summary={
          <>
            <span className="flex shrink-0 -space-x-2">
              {(isRemoved ? recipients : remaining).slice(0, PREVIEW_COUNT).map(({ address }) => (
                <Avatar key={address} size="xs" className="ring-2 ring-muted">
                  <AvatarImage src={blo(address as `0x${string}`)} alt="" />
                </Avatar>
              ))}
            </span>
            <Typography variant="paragraph-small-medium" className="min-w-0 flex-1 truncate">
              {remaining.length} recipient{maybePlural(remaining)}
            </Typography>
            {isRemoved && <ChangeBadge change="removed" />}
          </>
        }
      >
        {recipients.map(({ address, change }) => {
          const shownChange = isRemoved ? 'removed' : change

          return (
            <Card key={address} variant="muted" size="none" radius="lg" data-testid="allowlist-recipient">
              <div className="flex items-center gap-3 p-3">
                <div
                  className={cn('min-w-0 flex-1', shownChange === 'removed' && 'text-muted-foreground line-through')}
                >
                  <AccountIdentity address={address} name={findName(names, address)} showCopyButton />
                </div>
                {shownChange && <ChangeBadge change={shownChange} alignWithChevron />}
              </div>
            </Card>
          )
        })}
      </ExpandableCard>
    </DrawerSection>
  )
}

export default AllowlistRecipients
