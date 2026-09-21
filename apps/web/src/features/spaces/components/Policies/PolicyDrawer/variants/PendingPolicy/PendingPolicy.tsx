import type { ReactElement, ReactNode } from 'react'
import { ShieldCheck } from 'lucide-react'
import { DrawerList, DrawerSection } from '@/components/common/Drawer'
import { Alert, AlertDescription, AlertSeverityIcon, AlertTitle } from '@/components/ui/alert'
import { AccountIdentity, type AccountIdentityProps } from '../../components/AccountIdentity'
import { SafeSignatureInfo, type SignatureSafeInfo } from '../../components/SafeSignatureInfo'

export type PolicyOverview = {
  proposer: AccountIdentityProps
  appliesTo: AccountIdentityProps
  initiatedBy: AccountIdentityProps
  /** Preformatted — the caller owns locale and timezone. */
  lastUpdated: string
  /** What executes the policy onchain, e.g. `Safe module`. */
  enforcedBy: string
}

export type PendingPolicyProps = {
  /** Why the role has not activated yet — the wording depends on the Safe setup. */
  description: ReactNode
  /** The Safe whose signers still have to sign. */
  safe: SignatureSafeInfo
  signatures: number
  /** Omitted when the signature request does not expire. */
  expiresLabel?: string
  overview: PolicyOverview
}

export const PendingPolicy = ({
  description,
  safe,
  signatures,
  expiresLabel,
  overview,
}: PendingPolicyProps): ReactElement => (
  <div className="flex flex-col gap-4">
    <Alert variant="warning" outlined={false}>
      <AlertSeverityIcon variant="warning" />
      <AlertTitle>The proposer role is not active yet</AlertTitle>
      <AlertDescription>{description}</AlertDescription>
    </Alert>

    <DrawerSection title="Pending signatures" rightNode={expiresLabel}>
      <SafeSignatureInfo safe={safe} signatures={signatures} />
    </DrawerSection>

    <DrawerSection title="Policy overview">
      <DrawerList
        items={[
          { label: 'Proposer', content: <AccountIdentity {...overview.proposer} /> },
          { label: 'Applies to', content: <AccountIdentity {...overview.appliesTo} /> },
          { label: 'Initiated by', content: <AccountIdentity {...overview.initiatedBy} /> },
          { label: 'Last updated', content: overview.lastUpdated },
          {
            label: 'Enforced by',
            content: (
              <span className="inline-flex items-center gap-1">
                <ShieldCheck className="size-3.5" />
                <span className="underline">{overview.enforcedBy}</span>
              </span>
            ),
          },
        ]}
      />
    </DrawerSection>
  </div>
)
