import type { ReactElement } from 'react'
import { Clock, ShieldCheck, UsersRound } from 'lucide-react'
import { HelpCenterArticle } from '@safe-global/utils/config/constants'
import PolicyIntroDialog, {
  type PolicyIntroExplainer,
} from '@safe-global/views/features/spaces/components/Policies/PolicyIntroDialog'
import { POLICY_CHANGE_DELAY } from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/constants'
import RecipientAllowlistPreview from './RecipientAllowlistPreview'

const EXPLAINERS: PolicyIntroExplainer[] = [
  { Icon: UsersRound, text: 'Only addresses on the list can receive funds from this Safe account.' },
  { Icon: ShieldCheck, text: 'Transfers to any other address are blocked.' },
  {
    Icon: Clock,
    text: `Setting it up, changing it or removing it requires a transaction. Every change waits ${POLICY_CHANGE_DELAY} before it applies.`,
  },
]

export interface RecipientAllowlistIntroDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onProceed: () => void
}

const RecipientAllowlistIntroDialog = ({
  open,
  onOpenChange,
  onProceed,
}: RecipientAllowlistIntroDialogProps): ReactElement => (
  <PolicyIntroDialog
    open={open}
    onOpenChange={onOpenChange}
    onProceed={onProceed}
    title="Recipient allowlist"
    description="Only let funds go to addresses you approve."
    helpArticle={HelpCenterArticle.POLICIES}
    helpLabel="Learn more about recipient allowlists"
    explainers={EXPLAINERS}
    preview={<RecipientAllowlistPreview />}
    proceedLabel="Set up recipient allowlist"
    testId="recipient-allowlist-intro-dialog"
  />
)

export default RecipientAllowlistIntroDialog
