import type { ReactElement, ReactNode } from 'react'
import { DrawerSection } from '@/components/common/Drawer'
import { Alert, AlertDescription, AlertSeverityIcon, AlertTitle } from '@/components/ui/alert'
import { ProposerOverview, type ProposerOverviewProps } from '../../components/ProposerOverview'
import { SafeSignatureInfo, type SignatureSafeInfo } from '../../components/SafeSignatureInfo'

export type PendingProposerProps = {
  description: ReactNode
  safe: SignatureSafeInfo
  signatures: number
  expiresLabel?: string
  overview: ProposerOverviewProps
}

export const PendingProposer = ({
  description,
  safe,
  signatures,
  expiresLabel,
  overview,
}: PendingProposerProps): ReactElement => (
  <div className="flex flex-col gap-4">
    <Alert variant="warning" outlined={false}>
      <AlertSeverityIcon variant="warning" />
      <AlertTitle>The proposer role is not active yet</AlertTitle>
      <AlertDescription>{description}</AlertDescription>
    </Alert>

    <DrawerSection title="Pending signatures" rightNode={expiresLabel}>
      <SafeSignatureInfo safe={safe} signatures={signatures} />
    </DrawerSection>

    <ProposerOverview {...overview} />
  </div>
)
