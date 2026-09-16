import type { ReactElement } from 'react'
import { PencilLine, ShieldCheck, UsersRound } from 'lucide-react'
import { HelpCenterArticle } from '@safe-global/utils/config/constants'
import PolicyIntroDialog, { type PolicyIntroExplainer } from '../PolicyIntroDialog'
import ProposerPreview from './ProposerPreview'

const EXPLAINERS: PolicyIntroExplainer[] = [
  {
    Icon: UsersRound,
    text: 'Proposers can suggest transactions but cannot approve or execute them.',
  },
  {
    Icon: ShieldCheck,
    text: 'Separate transaction preparation from transaction approval while maintaining security.',
  },
  {
    Icon: PencilLine,
    text: 'Any changes require owner signatures, and all permissions are managed through Safe{Wallet}.',
  },
]

export interface ProposerIntroDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onProceed: () => void
}

const ProposerIntroDialog = ({ open, onOpenChange, onProceed }: ProposerIntroDialogProps): ReactElement => (
  <PolicyIntroDialog
    open={open}
    onOpenChange={onOpenChange}
    onProceed={onProceed}
    title="Proposer role"
    description="Let teammates without signing rights propose transactions."
    helpArticle={HelpCenterArticle.PROPOSERS}
    helpLabel="Learn more about proposers"
    explainers={EXPLAINERS}
    preview={<ProposerPreview />}
    proceedLabel="Set up proposer"
    testId="proposer-intro-dialog"
  />
)

export default ProposerIntroDialog
