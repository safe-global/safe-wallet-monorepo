import type { ReactElement, ReactNode } from 'react'
import { TriangleAlert } from 'lucide-react'
import { DrawerSection } from '@/components/common/Drawer'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ProposerOverview, type ProposerOverviewProps } from '../../components/ProposerOverview'
import { SafeSignatureInfo, type SignatureSafeInfo } from '../../components/SafeSignatureInfo'

export type NotActivatedProposerProps = {
  description: ReactNode
  safe: SignatureSafeInfo
  signatures: number
  expiresLabel?: string
  overview: ProposerOverviewProps
}

export const NotActivatedProposer = ({
  description,
  safe,
  signatures,
  expiresLabel,
  overview,
}: NotActivatedProposerProps): ReactElement => (
  <div className="flex flex-col gap-4">
    {/* Figma pairs the error alert with triangle-alert, not the destructive default (circle-alert) */}
    <Alert variant="destructive" outlined={false}>
      <TriangleAlert />
      <AlertTitle>The proposer role was not activated</AlertTitle>
      <AlertDescription>{description}</AlertDescription>
    </Alert>

    <DrawerSection title="Pending signatures" rightNode={expiresLabel}>
      <SafeSignatureInfo safe={safe} signatures={signatures} badgeVariant="destructive" />
    </DrawerSection>

    <ProposerOverview {...overview} />
  </div>
)
