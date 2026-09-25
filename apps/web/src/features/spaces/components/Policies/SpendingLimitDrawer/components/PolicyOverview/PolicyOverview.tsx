import type { ReactElement } from 'react'
import { ShieldCheck } from 'lucide-react'
import { DrawerList, DrawerSection, type DrawerListItem } from '@/components/common/Drawer'
import { Link } from '@/components/ui/link'
import { AccountIdentity, type AccountIdentityProps } from '../../../components/AccountIdentity'

export type PolicyOverviewProps = {
  appliesTo: AccountIdentityProps
  /** Omitted for spending limits — CGW returns no initiator for them. */
  initiatedBy?: AccountIdentityProps
  lastUpdated: string
  enforcedBy: string
  /** Block explorer link for the enforcing contract. Without it the name is plain text, not a dead underline. */
  enforcedByHref?: string
}

const PolicyOverview = ({
  appliesTo,
  initiatedBy,
  lastUpdated,
  enforcedBy,
  enforcedByHref,
}: PolicyOverviewProps): ReactElement => {
  const items: DrawerListItem[] = [{ label: 'Applies to', content: <AccountIdentity {...appliesTo} /> }]

  if (initiatedBy) {
    items.push({ label: 'Initiated by', content: <AccountIdentity {...initiatedBy} /> })
  }

  items.push(
    { label: 'Last updated', content: lastUpdated },
    {
      label: 'Enforced by',
      content: (
        <span className="inline-flex items-center gap-1">
          <ShieldCheck className="size-3.5" />
          {/* `inherit` keeps the row's text style; the default link variant is bold and primary. */}
          {enforcedByHref ? (
            <Link
              href={enforcedByHref}
              variant="inherit"
              className="underline"
              target="_blank"
              rel="noreferrer noopener"
            >
              {enforcedBy}
            </Link>
          ) : (
            <span>{enforcedBy}</span>
          )}
        </span>
      ),
    },
  )

  return (
    <DrawerSection title="Policy overview">
      <DrawerList items={items} />
    </DrawerSection>
  )
}

export default PolicyOverview
