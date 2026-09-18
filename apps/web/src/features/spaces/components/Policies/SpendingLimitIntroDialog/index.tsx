import type { ReactElement } from 'react'
import { CalendarClock, HandCoins, UsersRound } from 'lucide-react'
import { HelpCenterArticle } from '@safe-global/utils/config/constants'
import PolicyIntroDialog, { type PolicyIntroExplainer } from '../PolicyIntroDialog'
import SpendingLimitPreview from './SpendingLimitPreview'

const EXPLAINERS: PolicyIntroExplainer[] = [
  {
    Icon: UsersRound,
    text: "Anyone can be a spender, they don't need to be signers of this Safe account.",
  },
  {
    Icon: CalendarClock,
    text: 'Choose a token and an amount per day, week, or month. When the period ends, the limit resets automatically.',
  },
  {
    Icon: HandCoins,
    text: "Creating the limit requires a transaction. Once it's active, spending within the limit needs no further approvals.",
  },
]

export interface SpendingLimitIntroDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onProceed: () => void
}

const SpendingLimitIntroDialog = ({ open, onOpenChange, onProceed }: SpendingLimitIntroDialogProps): ReactElement => (
  <PolicyIntroDialog
    open={open}
    onOpenChange={onOpenChange}
    onProceed={onProceed}
    title="Spending limit"
    description="Let spenders access assets without collecting signatures."
    helpArticle={HelpCenterArticle.SPENDING_LIMITS}
    helpLabel="Learn more about spending limits"
    explainers={EXPLAINERS}
    preview={<SpendingLimitPreview />}
    proceedLabel="Set up spending limit"
    testId="spending-limit-intro-dialog"
  />
)

export default SpendingLimitIntroDialog
