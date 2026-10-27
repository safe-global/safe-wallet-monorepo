import type { ReactElement } from 'react'
import { Ban, BadgeCheck, Clock, FileCode2, ShieldCheck, UsersRound, type LucideIcon } from 'lucide-react'
import { HelpCenterArticle } from '@safe-global/utils/config/constants'
import { Badge } from '@safe-global/views/components/ui/badge'
import { Typography } from '@safe-global/views/components/ui/typography'
import { cn } from '@safe-global/views/utils/cn'
import PolicyIntroDialog, {
  type PolicyIntroExplainer,
} from '@safe-global/views/features/spaces/components/Policies/PolicyIntroDialog'

const EXPLAINERS: PolicyIntroExplainer[] = [
  {
    Icon: ShieldCheck,
    text: 'Every transaction on the Safe account is checked onchain, including changes to signers, the threshold and policies.',
  },
  { Icon: Ban, text: 'Anything the rules don’t allow is blocked, even if every signer approves it.' },
  {
    Icon: Clock,
    text: 'Setting it up or changing it needs a transaction. Every change waits 24 hours before it applies.',
  },
]

type Rule = { name: string; description: string; Icon: LucideIcon; available: boolean }

const RULES: Rule[] = [
  {
    name: 'Allowlist',
    description: 'Only send chosen tokens to chosen recipients.',
    Icon: UsersRound,
    available: true,
  },
  { name: 'Contract rules', description: 'Only allow chosen apps and actions.', Icon: FileCode2, available: false },
  { name: 'Cosigner', description: 'An independent check on every transaction.', Icon: BadgeCheck, available: false },
]

/** Where the first rule is picked: the allowlist is the only one so far, so it's the one selected. */
const RulePicker = (): ReactElement => (
  <div
    className="flex w-full flex-col gap-2 rounded-xl bg-mint p-3"
    role="radiogroup"
    aria-label="First rule"
    data-m2-new="New · Protection rule picker"
  >
    <Typography variant="paragraph-mini-medium" className="px-1 text-accent-secondary-foreground">
      Start with a rule
    </Typography>
    {RULES.map(({ name, description, Icon, available }) => (
      <div
        key={name}
        role="radio"
        aria-checked={available}
        aria-disabled={!available}
        className={cn(
          'flex items-center gap-3 rounded-lg border bg-card p-3',
          available ? 'border-foreground' : 'border-transparent opacity-60',
        )}
      >
        <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        <div className="flex min-w-0 flex-1 flex-col">
          <Typography variant="paragraph-small-medium">{name}</Typography>
          <Typography variant="paragraph-small" color="muted">
            {description}
          </Typography>
        </div>
        {available ? (
          <span className="flex size-4 items-center justify-center rounded-full border border-foreground" aria-hidden>
            <span className="size-2 rounded-full bg-foreground" />
          </span>
        ) : (
          <Badge variant="subtle" shape="tag">
            Coming soon
          </Badge>
        )}
      </div>
    ))}
  </div>
)

export type AllowlistIntroDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onProceed: () => void
}

/** The account protection's intro, in M1's PolicyIntroDialog, with the rule picker where M1 shows its preview. */
export const AllowlistIntroDialog = ({ open, onOpenChange, onProceed }: AllowlistIntroDialogProps): ReactElement => (
  <PolicyIntroDialog
    open={open}
    onOpenChange={onOpenChange}
    onProceed={onProceed}
    title="Account protection"
    description="A layer of rules above everything else on a Safe account. Pick the first rule to start; you can add more later."
    helpArticle={HelpCenterArticle.POLICIES}
    helpLabel="Learn more about account protection"
    explainers={EXPLAINERS}
    preview={<RulePicker />}
    proceedLabel="Set up allowlist"
    testId="recipient-allowlist-intro-dialog"
  />
)
