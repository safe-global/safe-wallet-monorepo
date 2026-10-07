import type { ReactElement } from 'react'
import { ShieldCheck } from 'lucide-react'
import ChainIndicator from '@/components/common/ChainIndicator'
import { DrawerList, DrawerSection, type DrawerListItem } from '@/components/common/Drawer'
import { Link } from '@/components/ui/link'
import { AccountIdentity, type AccountIdentityProps } from '../../../components/AccountIdentity'

export type PolicyOverviewProps = {
  appliesTo: AccountIdentityProps
  chainId: string
  /** Omitted for spending limits — CGW returns no initiator for them. */
  initiatedBy?: AccountIdentityProps
  lastUpdated?: string
  enforcedBy: string
  /** Block explorer link for the enforcing contract. Without it the name is plain text, not a dead underline. */
  enforcedByHref?: string
}

const PolicyOverview = ({
  appliesTo,
  chainId,
  initiatedBy,
  lastUpdated,
  enforcedBy,
  enforcedByHref,
}: PolicyOverviewProps): ReactElement => {
  const items: DrawerListItem[] = [
    { label: 'Safe account', content: <AccountIdentity {...appliesTo} showCopyButton /> },
    { label: 'Network', content: <ChainIndicator chainId={chainId} inline className="min-w-0! justify-end!" /> },
  ]

  if (initiatedBy) {
    items.push({ label: 'Initiated by', content: <AccountIdentity {...initiatedBy} showCopyButton /> })
  }

  if (lastUpdated) {
    items.push({ label: 'Last updated', content: lastUpdated })
  }

  items.push({
    label: 'Enforced by',
    content: (
      <span className="inline-flex items-center gap-1">
        <ShieldCheck className="size-3.5" />
        {/* `inherit` keeps the row's text style; the default link variant is bold and primary. */}
        {enforcedByHref ? (
          <Link href={enforcedByHref} variant="inherit" className="underline" target="_blank" rel="noreferrer noopener">
            {enforcedBy}
          </Link>
        ) : (
          <span>{enforcedBy}</span>
        )}
      </span>
    ),
  })

  return (
    <DrawerSection title="Policy overview">
      <DrawerList items={items} />
    </DrawerSection>
  )
}

export default PolicyOverview
