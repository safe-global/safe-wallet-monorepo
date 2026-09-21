import type { ReactElement, ReactNode } from 'react'
import { DrawerSection } from '@/components/common/Drawer'
import { Alert, AlertDescription, AlertSeverityIcon, AlertTitle } from '@/components/ui/alert'
import { PolicyOverview, type PolicyOverviewProps } from '../../components/PolicyOverview'
import { SafeSignatureInfo, type SignatureSafeInfo } from '../../components/SafeSignatureInfo'

export type PendingPolicyProps = {
  /** Why the role has not activated yet — the wording depends on the Safe setup. */
  description: ReactNode
  /** The Safe whose signers still have to sign. */
  safe: SignatureSafeInfo
  signatures: number
  /** Omitted when the signature request does not expire. */
  expiresLabel?: string
  overview: PolicyOverviewProps
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

    <PolicyOverview {...overview} />
  </div>
)
