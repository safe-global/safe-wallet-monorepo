import type { ReactElement } from 'react'
import { ShieldCheck } from 'lucide-react'
import { DrawerList, DrawerSection } from '@/components/common/Drawer'
import { AccountIdentity, type AccountIdentityProps } from '../../../components/AccountIdentity'

export type PolicyOverviewProps = {
  appliesTo: AccountIdentityProps
  initiatedBy: AccountIdentityProps
  lastUpdated: string
  enforcedBy: string
}

const PolicyOverview = ({ appliesTo, initiatedBy, lastUpdated, enforcedBy }: PolicyOverviewProps): ReactElement => (
  <DrawerSection title="Policy overview">
    <DrawerList
      items={[
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

export default PolicyOverview
