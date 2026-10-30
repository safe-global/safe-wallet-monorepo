import type { ReactElement } from 'react'
import { blo } from 'blo'
import { maybePlural } from '@safe-global/utils/utils/formatters'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { DrawerSection } from '@/components/common/Drawer'
import { Avatar, AvatarImage } from '@safe-global/views/components/ui/avatar'
import { Card } from '@safe-global/views/components/ui/card'
import { Typography } from '@safe-global/views/components/ui/typography'
import { cn } from '@safe-global/views/utils/cn'
import { AccountIdentity } from '../../components/AccountIdentity'
import ExpandableCard from './ExpandableCard'
import RemovedBadge from './RemovedBadge'

const PREVIEW_COUNT = 3

export type AllowlistRecipientsProps = {
  recipients: string[]
  /** Address book names keyed by address, in any casing. The real map arrives with the CGW wiring. */
  names?: Record<string, string>
  isRemoved?: boolean
}

const findName = (names: AllowlistRecipientsProps['names'], address: string): string | undefined =>
  Object.entries(names ?? {}).find(([key]) => sameAddress(key, address))?.[1]

const AllowlistRecipients = ({ recipients, names, isRemoved = false }: AllowlistRecipientsProps): ReactElement => (
  <DrawerSection title="Who can receive funds">
    <ExpandableCard
      detailsLabel="recipient details"
      summary={
        <>
          <span className="flex shrink-0 -space-x-2">
            {recipients.slice(0, PREVIEW_COUNT).map((address) => (
              <Avatar key={address} size="xs" className="ring-2 ring-muted">
                <AvatarImage src={blo(address as `0x${string}`)} alt="" />
              </Avatar>
            ))}
          </span>
          <Typography variant="paragraph-small-medium" className="min-w-0 flex-1 truncate">
            {recipients.length} recipient{maybePlural(recipients)}
          </Typography>
          {isRemoved && <RemovedBadge />}
        </>
      }
    >
      {recipients.map((address) => (
        <Card key={address} variant="muted" size="none" radius="lg" data-testid="allowlist-recipient">
          <div className="flex items-center gap-3 p-3">
            <div className={cn('min-w-0 flex-1', isRemoved && 'text-muted-foreground line-through')}>
              <AccountIdentity address={address} name={findName(names, address)} showCopyButton />
            </div>
            {isRemoved && <RemovedBadge alignWithChevron />}
          </div>
        </Card>
      ))}
    </ExpandableCard>
  </DrawerSection>
)

export default AllowlistRecipients
