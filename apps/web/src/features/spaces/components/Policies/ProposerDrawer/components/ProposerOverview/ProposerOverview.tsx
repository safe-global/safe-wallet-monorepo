import type { ReactElement } from 'react'
import { ShieldCheck } from 'lucide-react'
import ChainIndicator from '@/components/common/ChainIndicator'
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
  chainId: string
  lastUpdated: string
  enforcedBy: string
}

const ProposerOverview = ({
  proposer,
  appliesTo,
  initiatedBy,
  chainId,
  lastUpdated,
  enforcedBy,
}: ProposerOverviewProps): ReactElement => (
  <DrawerSection title="Policy overview">
    <DrawerList
      items={[
        { label: 'Proposer', content: <AccountIdentity {...proposer} showCopyButton /> },
        { label: 'Safe account', content: <AccountIdentity {...appliesTo} showCopyButton /> },
        { label: 'Initiated by', content: <AccountIdentity {...initiatedBy} showCopyButton /> },
        { label: 'Network', content: <ChainIndicator chainId={chainId} inline className="min-w-0! justify-end!" /> },
        { label: 'Last updated', content: lastUpdated },
        {
          label: 'Enforced by',
          content: (
            <span className="inline-flex items-center gap-1">
              <ShieldCheck className="size-3.5" />
              <span>{enforcedBy}</span>
            </span>
          ),
        },
      ]}
    />
  </DrawerSection>
)

export default ProposerOverview

export const ProposerOverviewSkeleton = (): ReactElement => (
  <DrawerSection title="Policy overview">
    <DrawerList
      items={[
        { label: 'Proposer', content: <AccountIdentitySkeleton /> },
        { label: 'Safe account', content: <AccountIdentitySkeleton /> },
        { label: 'Initiated by', content: <AccountIdentitySkeleton /> },
        { label: 'Network', content: <Skeleton className="ml-auto h-4 w-24 bg-border" /> },
        { label: 'Last updated', content: <Skeleton className="ml-auto h-4 w-36 bg-border" /> },
        { label: 'Enforced by', content: <Skeleton className="ml-auto h-4 w-24 bg-border" /> },
      ]}
    />
  </DrawerSection>
)
