import type { ReactElement } from 'react'
import { DrawerSection } from '@safe-global/views/components/common/Drawer/components/DrawerSection'
import { Alert, AlertDescription, AlertSeverityIcon, AlertTitle } from '@safe-global/views/components/ui/alert'
import ProposerOverview from '../../components/ProposerOverview/ProposerOverview'
import SafeSignatureInfo from '../../components/SafeSignatureInfo/SafeSignatureInfo'
import type { PendingProposerProps } from '@safe-global/views/features/spaces/components/Policies/ProposerDrawer/variants/types'

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
