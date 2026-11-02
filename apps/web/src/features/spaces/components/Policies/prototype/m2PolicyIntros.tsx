import { useRef, type ReactElement, type ReactNode } from 'react'
import {
  ArrowRight,
  Ban,
  CalendarClock,
  Check,
  Clock,
  FileCode2,
  PenLine,
  Settings2,
  ShieldCheck,
  UserRoundPlus,
  UsersRound,
  type LucideIcon,
} from 'lucide-react'
import { HelpCenterArticle } from '@safe-global/utils/config/constants'
import Identicon from '@/components/common/Identicon'
import ExternalLink from '@safe-global/views/components/common/ExternalLink'
import { Button } from '@safe-global/views/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@safe-global/views/components/ui/dialog'
import { Typography } from '@safe-global/views/components/ui/typography'
import ProposerPreview from '../ProposerIntroDialog/ProposerPreview'
import SpendingLimitPreview from '../SpendingLimitIntroDialog/SpendingLimitPreview'
import type { SingleRuleKind } from './m2SetupFlow'

/** SpendingLimitPreview's frame: a sunken panel with one card on it. Hidden from assistive tech, the copy explains it. */
const PreviewFrame = ({ title, children }: { title: string; children: ReactNode }): ReactElement => (
  <div
    aria-hidden
    className="relative flex w-full items-center justify-center overflow-hidden rounded-xl bg-surface-sunken py-5"
  >
    <div className="flex w-[300px] flex-col gap-1.5 rounded-md bg-card p-3 shadow-lg">
      <Typography variant="paragraph-mini-medium">{title}</Typography>
      {children}
    </div>
  </div>
)

const PreviewRow = ({ lead, isBlocked = false }: { lead: ReactNode; isBlocked?: boolean }): ReactElement => (
  <div className={`flex items-center gap-2 rounded-md bg-muted p-2 ${isBlocked ? 'opacity-60' : ''}`}>
    {lead}
    <span className="h-2 w-24 rounded-full bg-border" />
    {isBlocked ? (
      <Ban className="ml-auto size-4 text-destructive" />
    ) : (
      <Check className="ml-auto size-4 text-badge-dot-success" />
    )}
  </div>
)

const PreviewIcon = ({ Icon }: { Icon: typeof Settings2 }): ReactElement => (
  <span className="flex size-5 items-center justify-center rounded-full bg-card">
    <Icon className="size-3 text-muted-foreground" />
  </span>
)

const ALLOWED_RECIPIENTS = [
  '0x4bc91d2e3f4a5b6c7d8e9f0a1b2c3d4e5f60a88b',
  '0x7a219e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b4412',
  '0x1f8e2a3b4c5d6e7f8091a2b3c4d5e6f708195517',
]
const BLOCKED_RECIPIENT = '0x6D0a9f2c71b8e04d6a3c5b17e92f08d4c6a13e58'

type IntroPoint = { Icon: LucideIcon; title: string; description: string }

/** One size for the subtitle and the points, a step above the app's small text. */
export const INTRO_TEXT_SIZE = 'text-[15px] leading-[22px]'
const INTRO_TEXT = `${INTRO_TEXT_SIZE} font-medium`

type IntroProps = { open: boolean; onOpenChange: (open: boolean) => void; onProceed: () => void }

/** M1's PolicyIntroDialog layout, with three short points in a heavier weight and neutral icons. */
const IntroDialog = ({
  open,
  onOpenChange,
  onProceed,
  title,
  description,
  helpArticle,
  helpLabel,
  points,
  preview,
  proceedLabel,
  testId,
}: IntroProps & {
  title: string
  description: string
  helpArticle: string
  helpLabel: string
  points: IntroPoint[]
  preview: ReactNode
  proceedLabel: string
  testId: string
}): ReactElement => {
  const proceedRef = useRef<HTMLButtonElement>(null)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="xs" initialFocus={proceedRef} data-testid={testId}>
        <DialogHeader>
          <DialogTitle className="text-xl leading-6 font-semibold">{title}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-5 px-5 pb-5" data-m2-new="New · Intro with three points">
          {/* The points say what it does, so the subtitle only links to more. */}
          <DialogDescription className={`${INTRO_TEXT} text-muted-foreground`}>
            <span className="sr-only">{description} </span>
            <ExternalLink
              href={helpArticle}
              className="font-normal [&>span]:underline [&>span]:decoration-current [&>span]:underline-offset-2"
            >
              {helpLabel}
            </ExternalLink>
          </DialogDescription>

          {preview}

          <ul className="flex flex-col gap-5">
            {points.map(({ Icon, title: pointTitle, description: pointDescription }) => (
              <li key={pointTitle} className="flex items-center gap-4">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted">
                  <Icon className="size-4 text-foreground" aria-hidden />
                </div>
                <div className={`flex flex-col ${INTRO_TEXT_SIZE}`}>
                  <p className="font-semibold text-foreground">{pointTitle}</p>
                  <p className="text-muted-foreground">{pointDescription}</p>
                </div>
              </li>
            ))}
          </ul>

          <Button ref={proceedRef} className="w-full gap-2" onClick={onProceed}>
            {proceedLabel}
            <ArrowRight className="text-[var(--color-static-text-brand)] dark:text-black" aria-hidden />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

const AllowlistPolicyIntro = (props: IntroProps): ReactElement => (
  <IntroDialog
    {...props}
    title="Allowlist"
    description="Only the addresses and tokens on your list can receive funds."
    helpArticle={HelpCenterArticle.POLICIES}
    helpLabel="Learn more about allowlists"
    points={[
      {
        Icon: UsersRound,
        title: 'Only the recipients you add',
        description: 'Sending anywhere else fails, even with every signature.',
      },
      { Icon: Clock, title: 'Changes wait 24 hours', description: 'Time to stop a change you didn’t expect.' },
    ]}
    preview={
      <PreviewFrame title="Allowed recipients">
        {ALLOWED_RECIPIENTS.map((address) => (
          <PreviewRow key={address} lead={<Identicon address={address} size={20} />} />
        ))}
        <PreviewRow lead={<Identicon address={BLOCKED_RECIPIENT} size={20} />} isBlocked />
      </PreviewFrame>
    }
    proceedLabel="Set up allowlist"
    testId="allowlist-intro-dialog"
  />
)

const AccountSettingsPolicyIntro = (props: IntroProps): ReactElement => (
  <IntroDialog
    {...props}
    title="Protected settings"
    description="Decide which changes to the Safe account itself are allowed."
    helpArticle={HelpCenterArticle.POLICIES}
    helpLabel="Learn more about protected settings"
    points={[
      {
        Icon: UserRoundPlus,
        title: 'Protect signers, threshold and policies',
        description: 'Changing them fails, even with every signature.',
      },
      { Icon: Clock, title: 'Changes wait 24 hours', description: 'Time to stop a change you didn’t expect.' },
    ]}
    preview={
      <PreviewFrame title="Account changes">
        <PreviewRow lead={<PreviewIcon Icon={UsersRound} />} />
        <PreviewRow lead={<PreviewIcon Icon={Settings2} />} />
        <PreviewRow lead={<PreviewIcon Icon={ShieldCheck} />} isBlocked />
      </PreviewFrame>
    }
    proceedLabel="Set up protected settings"
    testId="account-settings-intro-dialog"
  />
)

const ContractInteractionsPolicyIntro = (props: IntroProps): ReactElement => (
  <IntroDialog
    {...props}
    title="Contract interactions"
    description="Only the apps and actions you choose can be used from this account."
    helpArticle={HelpCenterArticle.POLICIES}
    helpLabel="Learn more about contract interactions"
    points={[
      {
        Icon: FileCode2,
        title: 'Only the apps you pick',
        description: 'Any other call fails, even with every signature.',
      },
      { Icon: Clock, title: 'Changes wait 24 hours', description: 'Time to stop a change you didn’t expect.' },
    ]}
    preview={
      <PreviewFrame title="Allowed contracts">
        <PreviewRow lead={<PreviewIcon Icon={FileCode2} />} />
        <PreviewRow lead={<PreviewIcon Icon={FileCode2} />} />
        <PreviewRow lead={<PreviewIcon Icon={FileCode2} />} isBlocked />
      </PreviewFrame>
    }
    proceedLabel="Set up contract interactions"
    testId="contract-interactions-intro-dialog"
  />
)

const SpendingLimitPolicyIntro = (props: IntroProps): ReactElement => (
  <IntroDialog
    {...props}
    title="Spending limit"
    description="Let spenders access assets without collecting signatures."
    helpArticle={HelpCenterArticle.SPENDING_LIMITS}
    helpLabel="Learn more about spending limits"
    points={[
      { Icon: PenLine, title: 'No signatures needed', description: 'Spenders send up to their limit on their own.' },
      { Icon: CalendarClock, title: 'Resets on your schedule', description: 'Every day, week or month.' },
    ]}
    preview={<SpendingLimitPreview />}
    proceedLabel="Set up spending limit"
    testId="spending-limit-intro-dialog"
  />
)

const ProposerPolicyIntro = (props: IntroProps): ReactElement => (
  <IntroDialog
    {...props}
    title="Proposer role"
    description="Let teammates without signing rights propose transactions."
    helpArticle={HelpCenterArticle.PROPOSERS}
    helpLabel="Learn more about proposers"
    points={[
      { Icon: PenLine, title: 'Drafts, never signs', description: 'Proposers create transactions for signers.' },
      { Icon: ShieldCheck, title: 'Signers stay in control', description: 'Nothing runs without their signatures.' },
    ]}
    preview={<ProposerPreview />}
    proceedLabel="Set up proposer"
    testId="proposer-intro-dialog"
  />
)

export type IntroKind = SingleRuleKind | 'contracts'

/** C: the intro each policy opens with, all in one layout; spending limits and proposers keep M1's previews. */
export const PolicyIntro = ({ kind, ...props }: IntroProps & { kind: IntroKind }): ReactElement => {
  switch (kind) {
    case 'allowlist':
      return <AllowlistPolicyIntro {...props} />
    case 'settings':
    case 'basics':
    case 'bundle':
      return <AccountSettingsPolicyIntro {...props} />
    case 'contracts':
      return <ContractInteractionsPolicyIntro {...props} />
    case 'limits':
      return <SpendingLimitPolicyIntro {...props} />
    case 'proposers':
      return <ProposerPolicyIntro {...props} />
  }
}
