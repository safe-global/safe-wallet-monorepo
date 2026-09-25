import type { ReactElement } from 'react'
import { ShieldCheck } from 'lucide-react'
import { DrawerList, DrawerSection } from '@/components/common/Drawer'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AccountIdentity,
  AccountIdentitySkeleton,
  type AccountIdentityProps,
} from '../../../components/AccountIdentity'

export type ProposerOverviewProps = {
  proposer: AccountIdentityProps
  appliesTo: AccountIdentityProps
  initiatedBy: AccountIdentityProps
  lastUpdated: string
  enforcedBy: string
}

const ProposerOverview = ({
  proposer,
  appliesTo,
  initiatedBy,
  lastUpdated,
  enforcedBy,
}: ProposerOverviewProps): ReactElement => (
  <DrawerSection title="Policy overview">
    <DrawerList
      items={[
        { label: 'Proposer', content: <AccountIdentity {...proposer} /> },
        { label: 'Applies to', content: <AccountIdentity {...appliesTo} /> },
        { label: 'Initiated by', content: <AccountIdentity {...initiatedBy} /> },
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
      ]}
    />
  </DrawerSection>
)

export default ProposerOverview

const ACCOUNT_LABELS = ['Proposer', 'Applies to', 'Initiated by']

export const ProposerOverviewSkeleton = (): ReactElement => (
  <DrawerSection title="Policy overview">
    <DrawerList
      items={[
        ...ACCOUNT_LABELS.map((label) => ({ label, content: <AccountIdentitySkeleton /> })),
        { label: 'Last updated', content: <Skeleton className="ml-auto h-4 w-36 bg-border" /> },
        { label: 'Enforced by', content: <Skeleton className="ml-auto h-4 w-24 bg-border" /> },
      ]}
    />
  </DrawerSection>
)
