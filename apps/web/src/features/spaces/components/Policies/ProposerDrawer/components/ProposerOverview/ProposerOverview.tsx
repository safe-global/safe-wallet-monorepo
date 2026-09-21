import type { ReactElement } from 'react'
import { ShieldCheck } from 'lucide-react'
import { DrawerList, DrawerSection } from '@/components/common/Drawer'
import { AccountIdentity, type AccountIdentityProps } from '../AccountIdentity'

export type ProposerOverviewProps = {
  proposer: AccountIdentityProps
  appliesTo: AccountIdentityProps
  initiatedBy: AccountIdentityProps
  /** Preformatted — the caller owns locale and timezone. */
  lastUpdated: string
  /** What executes the proposer role onchain, e.g. `Safe module`. */
  enforcedBy: string
}

/** The proposer role's facts, as every status shows them. */
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
