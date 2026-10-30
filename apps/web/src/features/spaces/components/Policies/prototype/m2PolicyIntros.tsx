import type { ReactElement, ReactNode } from 'react'
import { Ban, Check, Clock, FileCode2, Settings2, ShieldCheck, UserRoundPlus, UsersRound } from 'lucide-react'
import { HelpCenterArticle } from '@safe-global/utils/config/constants'
import Identicon from '@/components/common/Identicon'
import { Typography } from '@safe-global/views/components/ui/typography'
import PolicyIntroDialog, {
  type PolicyIntroExplainer,
} from '@safe-global/views/features/spaces/components/Policies/PolicyIntroDialog'
import ProposerIntroDialog from '../ProposerIntroDialog'
import SpendingLimitIntroDialog from '../SpendingLimitIntroDialog'
import type { SingleRuleKind } from './m2SetupFlow'

/** SpendingLimitPreview's frame: a sunken panel with one card on it. Hidden from assistive tech, the copy explains it. */
const PreviewFrame = ({ title, children }: { title: string; children: ReactNode }): ReactElement => (
  <div
    aria-hidden
    className="relative flex h-[200px] w-full items-center justify-center overflow-hidden rounded-xl bg-surface-sunken"
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

const ALLOWLIST_EXPLAINERS: PolicyIntroExplainer[] = [
  { Icon: UsersRound, text: 'You choose the addresses that can receive funds and the tokens they can receive.' },
  { Icon: ShieldCheck, text: 'It is checked onchain, so a blocked transfer fails even if every signer approves it.' },
  {
    Icon: Clock,
    text: 'Setting it up, changing it or removing it requires a transaction. Every change waits 24 hours before it applies.',
  },
]

const SETTINGS_EXPLAINERS: PolicyIntroExplainer[] = [
  {
    Icon: UserRoundPlus,
    text: 'You choose which changes to the account are allowed: signers, the threshold, policies and other settings.',
  },
  { Icon: ShieldCheck, text: 'A blocked change fails onchain, even if every signer approves it.' },
  { Icon: Clock, text: 'Changing these rules requires a transaction and waits 24 hours before it applies.' },
]

const CONTRACT_EXPLAINERS: PolicyIntroExplainer[] = [
  { Icon: FileCode2, text: 'You choose the apps and contracts the account can use, and which of their actions.' },
  { Icon: ShieldCheck, text: 'A call to anything else fails onchain, even if every signer approves it.' },
  { Icon: Clock, text: 'Setting it up or changing it requires a transaction and waits 24 hours before it applies.' },
]

type IntroProps = { open: boolean; onOpenChange: (open: boolean) => void; onProceed: () => void }

const AllowlistPolicyIntro = (props: IntroProps): ReactElement => (
  <PolicyIntroDialog
    {...props}
    title="Allowlist"
    description="Only the addresses and tokens on your list can receive funds."
    helpArticle={HelpCenterArticle.POLICIES}
    helpLabel="Learn more about allowlists"
    explainers={ALLOWLIST_EXPLAINERS}
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
  <PolicyIntroDialog
    {...props}
    title="Settings lock"
    description="Decide which changes to the Safe account itself are allowed."
    helpArticle={HelpCenterArticle.POLICIES}
    helpLabel="Learn more about settings lock"
    explainers={SETTINGS_EXPLAINERS}
    preview={
      <PreviewFrame title="Account changes">
        <PreviewRow lead={<PreviewIcon Icon={UsersRound} />} />
        <PreviewRow lead={<PreviewIcon Icon={Settings2} />} />
        <PreviewRow lead={<PreviewIcon Icon={ShieldCheck} />} isBlocked />
      </PreviewFrame>
    }
    proceedLabel="Set up settings lock"
    testId="account-settings-intro-dialog"
  />
)

const ContractInteractionsPolicyIntro = (props: IntroProps): ReactElement => (
  <PolicyIntroDialog
    {...props}
    title="Contract interactions"
    description="Only the apps and actions you choose can be used from this account."
    helpArticle={HelpCenterArticle.POLICIES}
    helpLabel="Learn more about contract interactions"
    explainers={CONTRACT_EXPLAINERS}
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

export type IntroKind = SingleRuleKind | 'contracts'

/** C: the intro each policy opens with: M1's own for spending limits and proposers, ours in the same dialog for the rest. */
export const PolicyIntro = ({ kind, ...props }: IntroProps & { kind: IntroKind }): ReactElement => {
  switch (kind) {
    case 'allowlist':
      return <AllowlistPolicyIntro {...props} />
    case 'settings':
      return <AccountSettingsPolicyIntro {...props} />
    case 'contracts':
      return <ContractInteractionsPolicyIntro {...props} />
    case 'limits':
      return <SpendingLimitIntroDialog {...props} />
    case 'proposers':
      return <ProposerIntroDialog {...props} />
  }
}
