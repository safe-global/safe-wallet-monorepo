import type { ReactElement } from 'react'
import { Clock, ShieldCheck, UsersRound, X } from 'lucide-react'
import { HelpCenterArticle } from '@safe-global/utils/config/constants'
import ExternalLink from '@safe-global/views/components/common/ExternalLink'
import { Badge } from '@safe-global/views/components/ui/badge'
import { Typography } from '@safe-global/views/components/ui/typography'
import PolicyIntroDialog, {
  type PolicyIntroExplainer,
} from '@safe-global/views/features/spaces/components/Policies/PolicyIntroDialog'
import { POLICY_CHANGE_DELAY } from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/constants'
import RecipientAllowlistPreview from './RecipientAllowlistPreview'

const EXPLAINERS: PolicyIntroExplainer[] = [
  { Icon: UsersRound, text: 'You choose who can receive funds and which tokens.' },
  { Icon: ShieldCheck, text: "It's checked onchain, so a blocked action fails even if every signer approves it." },
  { Icon: Clock, text: `Every change needs a transaction and waits ${POLICY_CHANGE_DELAY} before it applies.` },
]

const ACKNOWLEDGEMENT = {
  summary: (
    <div className="flex items-center justify-between gap-3 rounded-md bg-muted px-3 py-2">
      <Typography variant="paragraph-small-medium">Every other action</Typography>
      <Badge variant="destructive" size="status" shape="status">
        <X aria-hidden />
        Blocked
      </Badge>
    </div>
  ),
  label: (
    <>
      I understand that anything not allowed will be blocked.{' '}
      <ExternalLink noIcon href={HelpCenterArticle.POLICIES} onClick={(event) => event.stopPropagation()}>
        Learn more
      </ExternalLink>
    </>
  ),
}

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
    title="Allowlist"
    explainers={EXPLAINERS}
    preview={<RecipientAllowlistPreview />}
    acknowledgement={ACKNOWLEDGEMENT}
    proceedLabel="Set up allowlist"
    testId="recipient-allowlist-intro-dialog"
  />
)

export default RecipientAllowlistIntroDialog
