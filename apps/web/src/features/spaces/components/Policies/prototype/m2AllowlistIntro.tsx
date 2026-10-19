import type { ReactElement } from 'react'
import { Ban, Check, Clock, ShieldCheck, UsersRound } from 'lucide-react'
import { HelpCenterArticle } from '@safe-global/utils/config/constants'
import Identicon from '@/components/common/Identicon'
import { Typography } from '@safe-global/views/components/ui/typography'
import PolicyIntroDialog, {
  type PolicyIntroExplainer,
} from '@safe-global/views/features/spaces/components/Policies/PolicyIntroDialog'

const EXPLAINERS: PolicyIntroExplainer[] = [
  { Icon: UsersRound, text: 'You choose the addresses that can receive funds and the tokens they can receive.' },
  { Icon: ShieldCheck, text: 'It is checked onchain, so a blocked transfer fails even if every signer approves it.' },
  {
    Icon: Clock,
    text: 'Setting it up, changing it or removing it requires a transaction. Every change waits 24 hours before it applies.',
  },
]

const ALLOWED = [
  '0x4bc91d2e3f4a5b6c7d8e9f0a1b2c3d4e5f60a88b',
  '0x7a219e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b4412',
  '0x1f8e2a3b4c5d6e7f8091a2b3c4d5e6f708195517',
]
const BLOCKED = '0x6D0a9f2c71b8e04d6a3c5b17e92f08d4c6a13e58'

const PreviewRow = ({ address, isBlocked = false }: { address: string; isBlocked?: boolean }): ReactElement => (
  <div className="flex items-center gap-2 rounded-md bg-muted p-2">
    <Identicon address={address} size={20} />
    <span className="h-2 w-24 rounded-full bg-border" />
    {isBlocked ? (
      <Ban className="ml-auto size-4 text-destructive" />
    ) : (
      <Check className="ml-auto size-4 text-badge-dot-success" />
    )}
  </div>
)

/** SpendingLimitPreview's frame and card style: the allowed recipients go through, any other address is stopped. */
const AllowlistPreview = (): ReactElement => (
  // Hidden from assistive tech: the addresses are invented and the copy already explains the allowlist.
  <div
    aria-hidden
    className="relative flex h-[200px] w-full items-center justify-center overflow-hidden rounded-xl bg-surface-sunken"
    data-m2-new="New · Allowlist preview"
  >
    <div className="flex w-[300px] flex-col gap-1.5 rounded-md bg-card p-3 shadow-lg">
      <Typography variant="paragraph-mini-medium">Allowed recipients</Typography>
      {ALLOWED.map((address) => (
        <PreviewRow key={address} address={address} />
      ))}
      <div className="opacity-60">
        <PreviewRow address={BLOCKED} isBlocked />
      </div>
    </div>
  </div>
)

export type AllowlistIntroDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onProceed: () => void
}

/** The recipient allowlist's intro, in M1's PolicyIntroDialog like SpendingLimitIntroDialog and ProposerIntroDialog. */
export const AllowlistIntroDialog = ({ open, onOpenChange, onProceed }: AllowlistIntroDialogProps): ReactElement => (
  <PolicyIntroDialog
    open={open}
    onOpenChange={onOpenChange}
    onProceed={onProceed}
    title="Recipient allowlist"
    description="Only addresses on your list can receive funds. Everything else is blocked."
    helpArticle={HelpCenterArticle.POLICIES}
    helpLabel="Learn more about recipient allowlists"
    explainers={EXPLAINERS}
    preview={<AllowlistPreview />}
    proceedLabel="Set up recipient allowlist"
    testId="recipient-allowlist-intro-dialog"
  />
)
