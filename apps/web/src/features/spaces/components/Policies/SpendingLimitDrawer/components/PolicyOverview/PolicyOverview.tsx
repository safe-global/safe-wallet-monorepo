import type { ReactElement } from 'react'
import { ShieldCheck } from 'lucide-react'
import { DrawerList, DrawerSection, type DrawerListItem } from '@/components/common/Drawer'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AccountIdentity,
  AccountIdentitySkeleton,
  type AccountIdentityProps,
} from '../../../components/AccountIdentity'

export type PolicyOverviewProps = {
  appliesTo: AccountIdentityProps
  /** Omitted for spending limits — CGW returns no initiator for them. */
  initiatedBy?: AccountIdentityProps
  lastUpdated: string
  enforcedBy: string
}

const PolicyOverview = ({ appliesTo, initiatedBy, lastUpdated, enforcedBy }: PolicyOverviewProps): ReactElement => {
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
          <span className="underline">{enforcedBy}</span>
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

export const PolicyOverviewSkeleton = (): ReactElement => (
  <DrawerSection title="Policy overview">
    <DrawerList
      items={[
        { label: 'Applies to', content: <AccountIdentitySkeleton /> },
        { label: 'Last updated', content: <Skeleton className="ml-auto h-4 w-36 bg-border" /> },
        { label: 'Enforced by', content: <Skeleton className="ml-auto h-4 w-24 bg-border" /> },
      ]}
    />
  </DrawerSection>
)
