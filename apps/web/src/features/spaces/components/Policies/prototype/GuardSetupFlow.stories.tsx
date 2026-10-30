import {
  createContext,
  Fragment,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
  type RefObject,
} from 'react'
import type { Decorator, Meta, StoryObj } from '@storybook/react'
import { ArrowRight, Check, ChevronDown, ChevronUp, FileCode2, Settings2, Users, type LucideIcon } from 'lucide-react'
import { POLICY_ICONS } from '@safe-global/views/features/spaces/components/Policies/utils/policyIcon'
import { createPortal } from 'react-dom'
import Notifications from '@/components/common/Notifications'
import SafeLogo from '@/components/common/SafeLogo'
import { Badge } from '@safe-global/views/components/ui/badge'
import { Button } from '@safe-global/views/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@safe-global/views/components/ui/dropdown-menu'
import { Label } from '@safe-global/views/components/ui/label'
import { ShadcnProvider } from '@safe-global/views/components/ui/ShadcnProvider'
import { Switch } from '@safe-global/views/components/ui/switch'
import { HeaderAccountInfo, HeaderNavigation } from '@/features/spaces'
import { useDarkMode } from '@/hooks/useDarkMode'
import useWallet from '@/hooks/wallets/useWallet'
import { useWalletName } from '@/hooks/wallets/useWalletName'
import { Typography } from '@safe-global/views/components/ui/typography'
import { useAppDispatch } from '@/store'
import { showNotification } from '@/store/notificationsSlice'
import { cn } from '@safe-global/views/utils/cn'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@safe-global/views/components/ui/dialog'
import {
  ADD_POLICY_OPTIONS,
  type AddPolicyOption,
} from '@safe-global/views/features/spaces/components/Policies/AddPolicyDialog/options'
import { AccountPanel, type AccountDialog, type AccountState } from './m2AccountPanel'
import {
  getAllowlistAccountKeys,
  getPanelOrder,
  getPolicyRows,
  POLICY_ROW_LABELS,
  POLICY_TYPES,
  PoliciesByPolicyPage,
  PoliciesOverviewPage,
  SETUP_ROW_ID,
  type PanelEntry,
  type PaymentsSnapshot,
  type PolicyFilters,
  type PolicyRow,
  type SpendingLimitState,
} from './m2OverviewPage'
import { AllowlistIntroDialog } from './m2AllowlistIntro'
import { PolicyIntro, type IntroKind } from './m2PolicyIntros'
import type { PanelNav } from './m2PanelParts'
import {
  DEFAULT_PROTECTION_RULES,
  PolicyDrawer,
  ProtectionDrawer,
  type AllowlistPanelScenario,
  type ProtectionRules,
} from './m2PolicyDrawers'
import {
  AccountProtectionIcon,
  ADDRESS_BOOK,
  createPoliciesM2Story,
  getAccountKey,
  getAllowlistSettings,
  OPERATIONS,
  PAYMENTS,
  PAYMENTS_ARBITRUM,
  TRADING_DESK,
  TREASURY,
  TREASURY_BASE,
  VAULT_3,
  type M2Account,
  type SignerId,
  PrototypeModelContext,
  usePrototypeModel,
} from './m2Prototype'
import {
  ACCOUNT_SETTING_GROUPS,
  CONFIRM_STEP,
  CREATE_STEP,
  DEFAULT_CHOICES,
  EXECUTE_STEP,
  findM2Account,
  getActiveDetails,
  POLICIES_STEP,
  PROPOSERS_STEP,
  POPULAR_TOKENS,
  SETTINGS_STEP,
  REVIEW_STEP,
  SETUP_PREVIEW_HANDLERS,
  SetUpPoliciesFlow,
  WIZARD_STORE,
  type Preflight,
  type Recipient,
  type SetupChoices,
  type SingleRuleKind,
  type WizardMode,
} from './m2SetupFlow'

const SUGGESTION_OPTION = ADD_POLICY_OPTIONS.find(({ id }) => id === 'suggestion')

/** A quiet footer line, not a tile: it's feedback, not something to set up. */
const SuggestPolicyFooter = ({ onSelect }: { onSelect: (id: AddPolicyOption['id']) => void }): ReactElement | null =>
  SUGGESTION_OPTION ? (
    <div
      className="flex items-center justify-between gap-3 border-t border-border pt-4"
      data-m2-new="New · Suggest a policy"
    >
      <Typography variant="paragraph-small" color="muted">
        Missing a policy you need?
      </Typography>
      <Button variant="ghost-muted" size="sm" onClick={() => onSelect(SUGGESTION_OPTION.id)}>
        Suggest one
        <ArrowRight data-icon="inline-end" />
      </Button>
    </div>
  ) : null

/** Two levels: M1's tiles, as in the live Add policy dialog, with the allowlist as one of them. */
const OTHER_POLICY_OPTIONS: AddPolicyOption[] = ADD_POLICY_OPTIONS.filter(({ id }) => id !== 'suggestion')

const PROTECTION_PARTS: { label: string; soon?: boolean }[] = [
  { label: 'Allowlist' },
  { label: 'Account settings' },
  { label: 'Contract interactions', soon: true },
]

/** M1's AddPolicyOptionButton markup a size down (padding, icon, type), so the second level stays compact. */
const CompactPolicyTile = ({
  option: { title, description, Icon },
  onSelect,
}: {
  option: Pick<AddPolicyOption, 'title' | 'description' | 'Icon'>
  onSelect: () => void
}): ReactElement => (
  <button
    type="button"
    onClick={onSelect}
    className="group flex w-full cursor-pointer items-center gap-2.5 rounded-lg bg-muted p-3 text-left transition-colors hover:bg-secondary-hover focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none [&_svg]:transition-colors hover:[&_svg]:text-green-500"
  >
    <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-card">
      <Icon className="size-4" aria-hidden />
    </span>
    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
      <span className="flex items-center gap-1">
        <Typography variant="paragraph-small-medium" as="span">
          {title}
        </Typography>
        <ArrowRight className="size-3.5 shrink-0 transition-transform group-hover:translate-x-0.5" aria-hidden />
      </span>
      <Typography variant="paragraph-mini" color="muted" as="span">
        {description}
      </Typography>
    </span>
  </button>
)

const SIMPLE_POLICY_OPTIONS: { id: IntroKind; title: string; description: string; Icon: LucideIcon }[] = [
  { id: 'allowlist', title: 'Allowlist', description: 'Which tokens can be sent, and to whom.', Icon: Users },
  {
    id: 'settings',
    title: 'Settings lock',
    description: 'Which changes to signers, threshold and policies are allowed.',
    Icon: Settings2,
  },
  {
    id: 'limits',
    title: 'Spending limits',
    description: 'Let spenders send tokens without collecting signatures.',
    Icon: POLICY_ICONS['spending-limit'],
  },
  {
    id: 'proposers',
    title: 'Proposers',
    description: 'Let teammates without signing rights propose transactions.',
    Icon: POLICY_ICONS.proposer,
  },
  {
    id: 'contracts',
    title: 'Contract interactions',
    description: 'Which apps and contracts the account can use.',
    Icon: FileCode2,
  },
]

/** C: every policy on its own, as tiles; picking one starts its flow. Contract interactions waits at the end. */
/** One row of C's list: icon, name, what it does, and an arrow. */
const PolicyListRow = ({
  title,
  description,
  icon,
  onSelect,
  className,
}: {
  title: string
  description: string
  icon: ReactNode
  onSelect: () => void
  className?: string
}): ReactElement => (
  <button
    type="button"
    onClick={onSelect}
    className={cn(
      'group flex w-full cursor-pointer items-center gap-3 rounded-lg p-3 text-left transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
      className ?? 'bg-muted hover:bg-secondary-hover',
    )}
  >
    {icon}
    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
      <Typography variant="paragraph-small-medium" as="span">
        {title}
      </Typography>
      <Typography variant="paragraph-mini" color="muted" as="span">
        {description}
      </Typography>
    </span>
    <ArrowRight
      className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
      aria-hidden
    />
  </button>
)

/** C: every policy in one list; policy enforcement comes last, set apart because it covers the whole account. */
const SimplePolicyChooser = ({
  open,
  onOpenChange,
  onEnforce,
  onSelect,
  onSuggest,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onEnforce: () => void
  onSelect: (kind: IntroKind) => void
  onSuggest: () => void
}): ReactElement => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent size="sm" data-testid="simple-policy-dialog">
      <DialogHeader>
        <DialogTitle className="text-xl leading-6 font-semibold">Policies</DialogTitle>
      </DialogHeader>
      <div className="flex flex-col gap-4 px-4 pb-4" data-m2-new="New · One list of policies">
        <div className="flex flex-col gap-2">
          {SIMPLE_POLICY_OPTIONS.map(({ id, title, description, Icon }) => (
            <PolicyListRow
              key={id}
              title={title}
              description={description}
              icon={
                <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-card">
                  <Icon className="size-4" aria-hidden />
                </span>
              }
              onSelect={() => onSelect(id)}
            />
          ))}
          <PolicyListRow
            title="Policy enforcement"
            description="Blocks anything your policies don’t allow, even with every signature."
            icon={
              <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-foreground text-background">
                <AccountProtectionIcon className="size-4" aria-hidden />
              </span>
            }
            onSelect={onEnforce}
            className="border border-border bg-card hover:bg-muted"
          />
        </div>
        <SuggestPolicyFooter onSelect={onSuggest} />
      </div>
    </DialogContent>
  </Dialog>
)

/** Contract interactions, on its way: the compact tile's shape, dashed and flat, with no arrow. */
/** Account protection first, set apart: it covers the whole account; the other policies work on their own. */
const LevelsAddPolicyChooser = ({
  open,
  onOpenChange,
  onSetUpProtection,
  onSelect,
  protectedCount,
  accountCount,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSetUpProtection: () => void
  onSelect: (id: AddPolicyOption['id']) => void
  /** Accounts with account protection on or pending. */
  protectedCount: number
  accountCount: number
}): ReactElement => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent size="sm" data-testid="add-policy-dialog">
      <DialogHeader>
        <DialogTitle className="text-xl leading-6 font-semibold">Set up policies</DialogTitle>
      </DialogHeader>

      {/* Scrolls on its own once more policies make it taller than the screen. */}
      <div
        className="flex max-h-[calc(100vh-10rem)] flex-col gap-4 overflow-y-auto px-4 pb-4"
        data-m2-new="New · Add policy: account protection and other policies"
      >
        <section className="flex flex-col gap-3 rounded-xl border border-border p-3">
          <div className="flex items-end justify-between gap-4">
            <div className="flex min-w-0 flex-col gap-0.5">
              <Typography variant="paragraph-bold">Account protection</Typography>
              <Typography variant="paragraph-small" color="muted">
                Blocks anything your policies don’t allow, even with every signature.
              </Typography>
            </div>
            <Button size="sm" onClick={onSetUpProtection} className="shrink-0">
              Set up
              <ArrowRight data-icon="inline-end" />
            </Button>
          </div>
          {/* What the account protection flow sets up. */}
          <div className="flex flex-wrap items-center gap-1.5" data-m2-new="New · What account protection includes">
            {PROTECTION_PARTS.map(({ label, soon }) => (
              <Badge key={label} variant="subtle" shape="tag">
                {label}
                {soon && <span className="text-muted-foreground">· Soon</span>}
              </Badge>
            ))}
          </div>
          <Typography variant="paragraph-mini" color="muted">
            Active on {protectedCount} of {accountCount} accounts
          </Typography>
        </section>

        <section className="flex flex-col gap-2">
          <div className="flex flex-col gap-0.5">
            <Typography variant="paragraph-bold">Other policies</Typography>
            <Typography variant="paragraph-small" color="muted">
              They work on their own. Once account protection is set up, it checks them too.
            </Typography>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {OTHER_POLICY_OPTIONS.map((option) => (
              <CompactPolicyTile key={option.title} option={option} onSelect={() => onSelect(option.id)} />
            ))}
          </div>
        </section>

        <SuggestPolicyFooter onSelect={onSelect} />
      </div>
    </DialogContent>
  </Dialog>
)

const EXECUTION_TIME_MS = 2000
const TOGGLE_KEY = '.'

type Screen = 'overview' | 'wizard'

type PrototypeState = {
  screen: Screen
  /** The account whose panel is open over the overview. */
  panelKey: string | null
  /** The policy row whose drawer is open over the By policy view. */
  policyId: string | null
  /** The account (getAccountKey) whose protection overview is open; one panel at a time, so it clears policyId. */
  protectionKey?: string | null
  /** A policy opened from the account protection panel: its panel shows Back to that account's enforcement. */
  returnToProtectionKey?: string | null
  /** An allowlist side panel state picked in Jump to; null follows the prototype's own state. */
  panelScenario: AllowlistPanelScenario | null
  /** The Ops bot's spending limit next to the Payments allowlist; set by the All states canvas only. */
  spendingLimitState: SpendingLimitState
  addPolicyOpen: boolean
  /** The allowlist's intro dialog, between Add policy and the create flow. */
  introOpen: boolean
  /** The account the new allowlist is for (getAccountKey); null until picked on Create. */
  setupAccountKey: string | null
  /** "Set up protection" on an account's row: the account the intro was opened for, kept until it proceeds. */
  pendingAccountKey: string | null
  /** The setup was started from an account's row, so Create shows the account instead of the dropdown. */
  setupFromRow: boolean
  /** Account protection on its own (New → Account protection, a row's Set up), or the allowlist (New → Allowlist). */
  setupKind?: 'protection' | 'protection-edit' | 'policy' | 'rule'
  /** B: the rule added or edited on its own (setupKind 'rule'). */
  ruleKind?: SingleRuleKind
  ruleIsEdit?: boolean
  /** Where the rule flow goes back to: the panel it was opened from, or the table. */
  ruleReturnPolicyId?: string | null
  /** B: Trading desk's policy enforcement is live; off in the starting state, on through Jump to. */
  tradingDeskEnforced?: boolean
  /** An account whose protection change was executed and is waiting out its 24 hours. */
  protectionChangeKey?: string | null
  /** The account whose protection is being edited; the setup's own account and choices stay as they were. */
  protectionEditKey?: string | null
  /** What the edit borrowed, put back when it ends. */
  protectionEditReturn?: Pick<PrototypeState, 'choices' | 'setupKind'> | null
  /** Rules saved by an executed protection edit, per account (getAccountKey). */
  protectionRulesByAccount?: Record<string, ProtectionRules>
  /** Protection setup started by picking a policy for an unprotected account. */
  protectionForPolicy?: boolean
  /** The prototype follows one setup at a time. */
  account: AccountState
  signedBy: SignerId[]
  pendingChange: boolean
  dialog?: AccountDialog
  wizardStep: number
  choices: SetupChoices
  preflight: Preflight
  /** Edit changes a live allowlist from its side panel; every other way into the wizard creates one. */
  wizardMode: WizardMode
  /** Edit only: the allowlist before the edit, which Create compares against and Review marks changes from. */
  editInitialChoices: SetupChoices | null
  /** Edit only: the setup's own account and choices, put back when the edit ends, since the edit borrows both. */
  editRestore: Pick<PrototypeState, 'setupAccountKey' | 'choices'> | null
  /** Edit reached from Create by picking an account that already has an allowlist: the account stays changeable. */
  editFromCreate: boolean
  /** The setup's first execution just finished: its side panel confirms it once, until closed. */
  justActivated: boolean
}

const WIZARD_DEFAULTS: Pick<PrototypeState, 'choices' | 'preflight'> = {
  choices: DEFAULT_CHOICES,
  preflight: 'ready',
}

const INITIAL_STATE: PrototypeState = {
  screen: 'overview',
  panelKey: null,
  policyId: null,
  panelScenario: null,
  spendingLimitState: 'normal',
  addPolicyOpen: false,
  introOpen: false,
  setupAccountKey: null,
  pendingAccountKey: null,
  setupFromRow: false,
  account: 'not-set-up',
  signedBy: [],
  pendingChange: false,
  wizardStep: 0,
  wizardMode: 'create',
  editInitialChoices: null,
  editRestore: null,
  editFromCreate: false,
  justActivated: false,
  ...WIZARD_DEFAULTS,
}

/** Leaves edit mode, so the next way into the wizard creates again. */
const EDIT_ENDED: Partial<PrototypeState> = {
  wizardMode: 'create',
  editInitialChoices: null,
  editRestore: null,
  editFromCreate: false,
  wizardStep: 0,
}

const INITIAL_VIEWER: SignerId = 'nadia'

type Jump = {
  label: string
  state: Partial<PrototypeState>
  view?: OverviewView
  viewer?: SignerId
}

const PAYMENTS_KEY = getAccountKey(PAYMENTS)
const ON_PAYMENTS: Partial<PrototypeState> = { setupAccountKey: PAYMENTS_KEY }
const SETUP_STARTED: Partial<PrototypeState> = { ...ON_PAYMENTS, signedBy: ['nadia'] }
const FULLY_SIGNED: Partial<PrototypeState> = { ...ON_PAYMENTS, signedBy: ['nadia', 'tom'] }
const NOT_STARTED: Partial<PrototypeState> = { account: 'not-set-up', signedBy: [] }
const POLICY_TABLE: Partial<PrototypeState> = { screen: 'overview', panelKey: null }
const WIZARD: Partial<PrototypeState> = {
  screen: 'wizard',
  setupFromRow: true,
  panelKey: null,
  wizardMode: 'create',
  editInitialChoices: null,
  editRestore: null,
  editFromCreate: false,
  ...NOT_STARTED,
  ...ON_PAYMENTS,
}

// Payments' spending limits send USDC (Ops bot) and ETH (Payroll bot): unchecking those tokens puts them in conflict.
/** Fake vendors for the 20-recipient case; addresses are made up but well-formed. */
const VENDOR_NAMES = [
  'Design studio',
  'Audit firm',
  'Cloud hosting',
  'Market maker',
  'Exchange desk',
  'Grants multisig',
  'Office lease',
  'Recruiting agency',
  'Bug bounty',
  'Data provider',
  'Translation service',
  'Event venue',
  'Insurance broker',
  'Tax advisor',
  'Security council',
]

// A small linear congruential generator, so each fake address (and its identicon) looks different.
const fakeAddress = (seed: number): string => {
  let value = seed * 2654435761
  const digits = Array.from({ length: 40 }, () => {
    value = (value * 1103515245 + 12345) % 2147483648
    return (value % 16).toString(16)
  })
  return `0x${digits.join('')}`
}

/** 20 recipients: the 5 address book contacts, then 15 typed in. */
const MANY_RECIPIENTS: Recipient[] = [
  ...ADDRESS_BOOK.map(({ name, address }) => ({ name, address, source: 'address-book' as const, selected: true })),
  ...VENDOR_NAMES.map((name, index) => ({ name, address: fakeAddress(index + 1), selected: true })),
]

/** Payments' 3 tokens plus 17 added: 20 chips. */
const MANY_TOKENS_CHOICES: SetupChoices = {
  ...DEFAULT_CHOICES,
  excludedTokens: [],
  addedTokens: POPULAR_TOKENS.map(({ symbol }) => symbol),
  recipients: MANY_RECIPIENTS,
}

// A new setup starts with no recipients; later steps keep the prefilled ones so they have something to show.
const FRESH_CHOICES: SetupChoices = { ...DEFAULT_CHOICES, recipients: [] }
const CONFLICT_ONE: SetupChoices = { ...DEFAULT_CHOICES, excludedTokens: ['USDC'] }
const BLOCKED_SPENDING_LIMIT_TOKENS = ['USDC']

const PENDING_SETUP: Partial<PrototypeState> = { account: 'waiting', ...SETUP_STARTED }
const SIGNED_SETUP: Partial<PrototypeState> = { account: 'ready', ...FULLY_SIGNED }
const LIVE_SETUP: Partial<PrototypeState> = { account: 'enforcing', ...FULLY_SIGNED }

const SPENDING_LIMIT_ROW_ID = 'payments-spending-limit'
// A live Payments allowlist without USDC, the Ops bot limit's token.
const SPENDING_LIMIT_BLOCKED: Partial<PrototypeState> = {
  ...POLICY_TABLE,
  ...LIVE_SETUP,
  choices: CONFLICT_ONE,
  policyId: SPENDING_LIMIT_ROW_ID,
  spendingLimitState: 'blocked',
}
// A live Payments allowlist that allows USDC and applies to existing permissions (the default choices).
const SPENDING_LIMIT_LOCKED: Partial<PrototypeState> = {
  ...POLICY_TABLE,
  ...LIVE_SETUP,
  policyId: SPENDING_LIMIT_ROW_ID,
  spendingLimitState: 'locked',
}

const TABLE_ROWS = getPolicyRows({ state: 'enforcing', signedCount: 2, pendingChange: false })

const TRADING_DESK_BLOCKED_ROW = TABLE_ROWS.find(
  ({ type, account, status }) =>
    type === 'spending-limit' && getAccountKey(account) === getAccountKey(TRADING_DESK) && status === 'blocked',
)
const TRADING_DESK_LOCKED_ROW = TABLE_ROWS.find(
  ({ type, account, locked }) =>
    type === 'spending-limit' && getAccountKey(account) === getAccountKey(TRADING_DESK) && locked,
)

/** Editing the live Payments allowlist from its side panel (policyId), which Close reopens. */
const EDIT: Partial<PrototypeState> = {
  ...WIZARD,
  ...LIVE_SETUP,
  wizardMode: 'edit',
  policyId: SETUP_ROW_ID,
  editInitialChoices: DEFAULT_CHOICES,
  editRestore: { setupAccountKey: PAYMENTS_KEY, choices: DEFAULT_CHOICES },
}

// One recipient and one token unchecked; USDT, since no spending limit sends it.
const EDIT_TWO_CHANGES: SetupChoices = {
  ...DEFAULT_CHOICES,
  excludedTokens: ['USDT'],
  recipients: DEFAULT_CHOICES.recipients.map((recipient) =>
    recipient.name === 'Coinbase Prime' ? { ...recipient, selected: false } : recipient,
  ),
}

/** The new allowlist's side panel in one of its states; Nadia created and signed the setup, Tom hasn't yet. */
const allowlistPanel = (
  label: string,
  setup: Partial<PrototypeState>,
  scenario: AllowlistPanelScenario,
  viewer: SignerId = 'nadia',
): Jump => ({
  label,
  view: 'by-policy',
  viewer,
  state: { ...POLICY_TABLE, ...setup, policyId: SETUP_ROW_ID, panelScenario: scenario },
})

/** Accounts other than Payments on Ethereum keep a fixed state that matches their allowlist row. */
const OTHER_ACCOUNTS: { account: M2Account; state: AccountState }[] = [
  { account: PAYMENTS_ARBITRUM, state: 'not-set-up' },
  { account: TREASURY, state: 'enforcing' },
  { account: TREASURY_BASE, state: 'not-set-up' },
  { account: TRADING_DESK, state: 'enforcing' },
  { account: VAULT_3, state: 'not-set-up' },
  { account: OPERATIONS, state: 'not-set-up' },
]

const JUMP_GROUPS: { heading: string; jumps: Jump[] }[] = [
  {
    heading: 'Test session (B)',
    jumps: [
      {
        label: 'Start · no policy enforcement',
        view: 'by-policy',
        state: { ...POLICY_TABLE, tradingDeskEnforced: false },
      },
      {
        label: 'Policy enforcement active · Trading desk',
        view: 'by-policy',
        state: { ...POLICY_TABLE, tradingDeskEnforced: true },
      },
    ],
  },
  {
    heading: 'Set up account protection',
    jumps: [
      { label: 'How it works', state: { ...WIZARD, wizardStep: 0, choices: FRESH_CHOICES } },
      { label: 'Create', state: { ...WIZARD, wizardStep: CREATE_STEP, choices: FRESH_CHOICES } },
      {
        label: 'Create · 20 tokens, 20 recipients',
        state: { ...WIZARD, wizardStep: CREATE_STEP, choices: MANY_TOKENS_CHOICES },
      },
      { label: 'Policies', state: { ...WIZARD, wizardStep: POLICIES_STEP, setupKind: 'protection' } },
      { label: 'Safe account settings', state: { ...WIZARD, wizardStep: SETTINGS_STEP } },
      { label: 'Review', state: { ...WIZARD, wizardStep: REVIEW_STEP } },
      { label: 'Confirm', state: { ...WIZARD, wizardStep: CONFIRM_STEP } },
      { label: 'Execute', state: { ...WIZARD, wizardStep: EXECUTE_STEP, account: 'ready', ...FULLY_SIGNED } },
    ],
  },
  {
    // The edit flow on Payments' live allowlist, opened as its side panel's Edit does.
    heading: 'Edit account protection',
    jumps: [
      { label: 'Edit · Create', view: 'by-policy', state: { ...EDIT, wizardStep: CREATE_STEP } },
      {
        label: 'Edit · Review (2 changes)',
        view: 'by-policy',
        state: { ...EDIT, wizardStep: REVIEW_STEP, choices: EDIT_TWO_CHANGES },
      },
      {
        label: 'Edit · Execute',
        view: 'by-policy',
        state: { ...EDIT, wizardStep: EXECUTE_STEP, choices: EDIT_TWO_CHANGES },
      },
    ],
  },
  {
    // Create with the account failing one of its pre-setup checks.
    heading: 'Create · account checks',
    jumps: [
      {
        label: 'Unknown policy installed',
        state: { ...WIZARD, wizardStep: CREATE_STEP, choices: FRESH_CHOICES, preflight: 'other-guard' },
      },
      // Picking an account that already has an allowlist turns Create into an edit of it, the account still changeable.
      { label: 'Account protection already set up', view: 'by-policy', state: { ...EDIT, editFromCreate: true } },
      {
        label: 'Safe account needs an update',
        state: { ...WIZARD, wizardStep: CREATE_STEP, choices: FRESH_CHOICES, preflight: 'old-version' },
      },
    ],
  },
  {
    // The same states as M1's SpendingLimitDrawer stories, on the new allowlist (Payments).
    heading: 'Account protection side panel',
    jumps: [
      allowlistPanel('Active · signer', LIVE_SETUP, { viewer: 'signer' }),
      allowlistPanel('Active · just activated', { ...LIVE_SETUP, justActivated: true }, { viewer: 'signer' }),
      allowlistPanel('Active · no wallet', LIVE_SETUP, { viewer: 'disconnected' }),
      allowlistPanel('Active · not a signer', LIVE_SETUP, { viewer: 'non-signer' }),
      allowlistPanel('Pending · already signed', PENDING_SETUP, { viewer: 'signer-signed' }),
      allowlistPanel('Pending · not signed', PENDING_SETUP, { viewer: 'signer' }, 'tom'),
      allowlistPanel('Pending · no wallet', PENDING_SETUP, { viewer: 'disconnected' }),
      allowlistPanel('Pending · not a signer', PENDING_SETUP, { viewer: 'non-signer' }),
      allowlistPanel('Pending · fully signed', SIGNED_SETUP, { viewer: 'non-signer' }),
      allowlistPanel('Pending · removal', PENDING_SETUP, { viewer: 'signer', operation: 'remove' }, 'tom'),
      allowlistPanel('Executed · 24h delay', PENDING_SETUP, { viewer: 'signer', outcome: 'executed' }),
      allowlistPanel('Failed', PENDING_SETUP, { viewer: 'signer', outcome: 'failed' }),
      allowlistPanel('Replaced', PENDING_SETUP, { viewer: 'signer', outcome: 'replaced' }),
      allowlistPanel('Deleted', PENDING_SETUP, { viewer: 'signer', outcome: 'deleted' }),
    ],
  },
]

/** One frame of the All states canvas: a starting state for the prototype, opened with `?m2state=<id>`. */
type CanvasFrame = {
  id: string
  label: string
  jump: Omit<Jump, 'label'>
  policyFilters?: Partial<PolicyFilters>
  /** Safe addresses whose networks start expanded in the account table. */
  expanded?: string[]
}

export const CANVAS_PARAM = 'm2state'

const PENDING_TABLE: Partial<PrototypeState> = { ...POLICY_TABLE, account: 'waiting', ...SETUP_STARTED }
const BY_POLICY = 'by-policy' as const

export const CANVAS_ROWS: { title: string; frames: CanvasFrame[] }[] = [
  {
    title: 'Policy table (By policy)',
    frames: [
      { id: 'policy-table', label: 'Default', jump: { view: BY_POLICY, state: PENDING_TABLE } },
      {
        id: 'policy-table-filtered',
        label: 'Filtered: Account protection',
        jump: { view: BY_POLICY, state: PENDING_TABLE },
        policyFilters: { types: ['allowlist'] },
      },
      {
        id: 'policy-table-empty',
        label: 'Empty search result',
        jump: { view: BY_POLICY, state: PENDING_TABLE },
        policyFilters: { query: 'zzzz' },
      },
    ],
  },
  {
    title: 'Account table (By account)',
    frames: [
      { id: 'account-table', label: 'Default', jump: { view: 'by-account', state: PENDING_TABLE }, expanded: [] },
      {
        id: 'account-table-expanded',
        label: 'Expanded multi-network row',
        jump: { view: 'by-account', state: PENDING_TABLE },
        expanded: [PAYMENTS.address],
      },
    ],
  },
  {
    title: 'Side panels',
    frames: [
      {
        id: 'drawer-allowlist-active',
        label: 'Account protection · Active',
        jump: {
          view: BY_POLICY,
          state: { ...POLICY_TABLE, policyId: SETUP_ROW_ID, account: 'enforcing', ...FULLY_SIGNED },
        },
      },
      {
        id: 'drawer-allowlist-pending',
        label: 'Account protection · Pending',
        jump: { view: BY_POLICY, state: { ...PENDING_TABLE, policyId: SETUP_ROW_ID } },
      },
      {
        id: 'drawer-allowlist-change-pending',
        label: 'Account protection · Change pending',
        jump: {
          view: BY_POLICY,
          state: {
            ...POLICY_TABLE,
            policyId: SETUP_ROW_ID,
            account: 'enforcing',
            ...FULLY_SIGNED,
            pendingChange: true,
          },
        },
      },
      {
        id: 'drawer-spending-limit',
        label: 'Spending limit',
        jump: { view: BY_POLICY, state: { ...PENDING_TABLE, policyId: SPENDING_LIMIT_ROW_ID } },
      },
      {
        id: 'drawer-spending-limit-blocked',
        label: 'Spending limit · Blocked by the allowlist (Payments)',
        jump: { view: BY_POLICY, state: SPENDING_LIMIT_BLOCKED },
      },
      {
        id: 'drawer-spending-limit-locked',
        label: 'Spending limit · Locked by account protection (Payments)',
        jump: { view: BY_POLICY, state: SPENDING_LIMIT_LOCKED },
      },
      {
        id: 'drawer-spending-limit-trading-blocked',
        label: 'Spending limit · Blocked (Trading desk)',
        jump: { view: BY_POLICY, state: { ...PENDING_TABLE, policyId: TRADING_DESK_BLOCKED_ROW?.id ?? null } },
      },
      {
        id: 'drawer-spending-limit-trading-locked',
        label: 'Spending limit · Locked (Trading desk)',
        jump: { view: BY_POLICY, state: { ...PENDING_TABLE, policyId: TRADING_DESK_LOCKED_ROW?.id ?? null } },
      },
      {
        id: 'drawer-proposer',
        label: 'Proposer',
        jump: { view: BY_POLICY, state: { ...PENDING_TABLE, policyId: 'treasury-proposer' } },
      },
    ],
  },
  {
    title: 'Add policy dialog',
    frames: [
      {
        id: 'add-policy',
        label: 'Add policy',
        jump: { view: BY_POLICY, state: { ...POLICY_TABLE, addPolicyOpen: true } },
      },
    ],
  },
  {
    title: 'Create',
    frames: [
      {
        id: 'create-no-account',
        label: 'No account',
        jump: { state: { ...WIZARD, wizardStep: CREATE_STEP, choices: FRESH_CHOICES, setupAccountKey: null } },
      },
      {
        id: 'create-payments',
        label: 'Payments',
        jump: { state: { ...WIZARD, wizardStep: CREATE_STEP, choices: FRESH_CHOICES } },
      },
      {
        id: 'create-many',
        label: '20 tokens, 20 recipients',
        jump: { state: { ...WIZARD, wizardStep: CREATE_STEP, choices: MANY_TOKENS_CHOICES } },
      },
      {
        id: 'create-treasury',
        label: 'Treasury',
        jump: {
          state: {
            ...WIZARD,
            wizardStep: CREATE_STEP,
            choices: FRESH_CHOICES,
            setupAccountKey: getAccountKey(TREASURY),
          },
        },
      },
      {
        id: 'create-vault-3',
        label: 'Vault 3',
        jump: {
          state: {
            ...WIZARD,
            wizardStep: CREATE_STEP,
            choices: FRESH_CHOICES,
            setupAccountKey: getAccountKey(VAULT_3),
          },
        },
      },
      {
        id: 'create-old-version',
        label: 'Failure · Old version',
        jump: { state: { ...WIZARD, wizardStep: CREATE_STEP, choices: FRESH_CHOICES, preflight: 'old-version' } },
      },
      {
        id: 'create-other-guard',
        label: 'Failure · Unknown policy installed',
        jump: { state: { ...WIZARD, wizardStep: CREATE_STEP, choices: FRESH_CHOICES, preflight: 'other-guard' } },
      },
      {
        id: 'create-existing-allowlist',
        label: 'Account protection already set up (edit)',
        jump: { view: 'by-policy', state: { ...EDIT, editFromCreate: true } },
      },
    ],
  },
  {
    title: 'Policies',
    frames: [
      {
        id: 'permissions',
        label: 'Payments',
        jump: { state: { ...WIZARD, wizardStep: POLICIES_STEP, setupKind: 'protection' } },
      },
    ],
  },
  {
    title: 'Safe account settings',
    frames: [
      { id: 'settings', label: 'All allowed', jump: { state: { ...WIZARD, wizardStep: SETTINGS_STEP } } },
      {
        id: 'settings-none',
        label: 'None allowed',
        jump: {
          state: {
            ...WIZARD,
            wizardStep: SETTINGS_STEP,
            choices: {
              ...DEFAULT_CHOICES,
              blockedSettings: ACCOUNT_SETTING_GROUPS.flatMap(({ settings }) => settings.map(({ id }) => id)),
            },
          },
        },
      },
    ],
  },
  {
    title: 'Review, Confirm, Execute',
    frames: [
      { id: 'review', label: 'Review', jump: { state: { ...WIZARD, wizardStep: REVIEW_STEP } } },
      { id: 'confirm', label: 'Confirm', jump: { state: { ...WIZARD, wizardStep: CONFIRM_STEP } } },
      {
        id: 'execute',
        label: 'Execute',
        jump: { state: { ...WIZARD, wizardStep: EXECUTE_STEP, account: 'ready', ...FULLY_SIGNED } },
      },
    ],
  },
  {
    title: 'Edit',
    frames: [
      {
        id: 'edit-create',
        label: 'Edit · Create (Payments)',
        jump: { view: BY_POLICY, state: { ...EDIT, wizardStep: CREATE_STEP } },
      },
      {
        id: 'edit-review',
        label: 'Edit · Review (2 changes)',
        jump: { view: BY_POLICY, state: { ...EDIT, wizardStep: REVIEW_STEP, choices: EDIT_TWO_CHANGES } },
      },
    ],
  },
]

/** The frame this page was opened as, when it is a frame of the All states canvas. */
const getCanvasFrame = (): CanvasFrame | undefined => {
  if (typeof window === 'undefined') return undefined
  const id = new URLSearchParams(window.location.search).get(CANVAS_PARAM)
  return CANVAS_ROWS.flatMap(({ frames }) => frames).find((frame) => frame.id === id)
}

/** `?m2mark=1` starts with "Mark new components" on; the All states canvas passes it on to its frames. */
export const MARK_NEW_PARAM = 'm2mark'
const MARK_NEW_ATTRIBUTE = 'data-m2-mark-new'

const isMarkNewRequested = (): boolean =>
  typeof window !== 'undefined' && new URLSearchParams(window.location.search).get(MARK_NEW_PARAM) === '1'

type PrototypeHandlers = { jump: (jump: Jump) => void; reset: () => void }

const getJumpKey = (heading: string, { label }: Jump): string => `${heading} · ${label}`

// By account is only reachable as an All states canvas frame; the prototype itself always shows By policy.
type OverviewView = 'by-account' | 'by-policy'

type PrototypeFrameValue = {
  viewer: SignerId
  setViewer: (viewer: SignerId) => void
  view: OverviewView
  /** The Jump to item on screen, as "heading · label"; cleared once the prototype is used by hand. */
  currentJump: string | null
  setCurrentJump: (jump: string | null) => void
  /** The flow registers its jump and reset here, so the bar outside the app can drive it. */
  handlers: RefObject<PrototypeHandlers | null>
  /** Whether the bar takes its 40px at the top, so the full-screen flow starts below it. */
  isBarExpanded: boolean
  isMarkingNew: boolean
  setIsMarkingNew: (isMarkingNew: boolean) => void
}

const PrototypeFrameContext = createContext<PrototypeFrameValue | null>(null)

const usePrototypeFrame = (): PrototypeFrameValue => {
  const value = useContext(PrototypeFrameContext)
  if (!value) throw new Error('usePrototypeFrame must be used inside PrototypeFrame')
  return value
}

type BarMode = 'expanded' | 'collapsed' | 'hidden'

const isTyping = (target: EventTarget | null): boolean =>
  target instanceof HTMLElement &&
  (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))

const PrototypeBar = ({ onCollapse }: { onCollapse: () => void }): ReactElement => {
  const { currentJump, setCurrentJump, handlers, isMarkingNew, setIsMarkingNew } = usePrototypeFrame()
  const markNewId = useId()

  return (
    <div className="fixed inset-x-0 top-0 flex h-10 items-center gap-4 border-b border-border bg-card px-4">
      <Badge variant="warning">Prototype</Badge>

      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="outline" size="xs" />}>
          Jump to
          <ChevronDown data-icon="inline-end" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {JUMP_GROUPS.map(({ heading, jumps }, index) => (
            <Fragment key={heading}>
              {index > 0 && <DropdownMenuSeparator />}
              <DropdownMenuGroup>
                <DropdownMenuLabel>{heading}</DropdownMenuLabel>
                {jumps.map((jump) => {
                  const key = getJumpKey(heading, jump)
                  const isCurrent = key === currentJump

                  return (
                    <DropdownMenuItem
                      key={jump.label}
                      onClick={() => {
                        handlers.current?.jump(jump)
                        setCurrentJump(key)
                      }}
                    >
                      {jump.label}
                      {isCurrent && <Check className="ml-auto" aria-label="Showing" />}
                    </DropdownMenuItem>
                  )
                })}
              </DropdownMenuGroup>
            </Fragment>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="flex shrink-0 items-center gap-2">
        <Switch id={markNewId} checked={isMarkingNew} onCheckedChange={(checked) => setIsMarkingNew(checked)} />
        <Label htmlFor={markNewId} className="text-xs font-normal">
          Mark new components
        </Label>
      </div>

      {currentJump && (
        <Typography variant="paragraph-mini" color="muted" className="min-w-0 truncate">
          Showing: <span className="font-medium text-foreground">{currentJump}</span>
        </Typography>
      )}

      <Button variant="ghost-muted" size="xs" onClick={() => handlers.current?.reset()}>
        Reset
      </Button>

      <div className="ml-auto flex items-center gap-2">
        <Typography variant="paragraph-mini" color="muted">
          Press &quot;.&quot; to hide
        </Typography>
        <Button variant="ghost-muted" size="icon-sm" aria-label="Collapse prototype bar" onClick={onCollapse}>
          <ChevronUp />
        </Button>
      </div>
    </div>
  )
}

/** The app's frame has a transform, so its fixed sidebar, top bar and dialogs start below the bar, not under it. */
const PrototypeFrame = ({ isDark, children }: { isDark: boolean; children: ReactNode }): ReactElement => {
  const [canvasFrame] = useState(getCanvasFrame)
  const [viewer, setViewer] = useState<SignerId>(canvasFrame?.jump.viewer ?? INITIAL_VIEWER)
  const view: OverviewView = canvasFrame?.jump.view ?? 'by-policy'
  // A canvas frame shows the screen alone.
  const [barMode, setBarMode] = useState<BarMode>(canvasFrame ? 'hidden' : 'expanded')
  const [currentJump, setCurrentJump] = useState<string | null>(null)
  const [isMarkingNew, setIsMarkingNew] = useState(isMarkNewRequested)
  const handlers = useRef<PrototypeHandlers | null>(null)

  // On <html>, not the frame, so dropdowns, drawers and the full-screen flow portalled to <body> are marked too.
  useEffect(() => {
    document.documentElement.toggleAttribute(MARK_NEW_ATTRIBUTE, isMarkingNew)
    return () => document.documentElement.removeAttribute(MARK_NEW_ATTRIBUTE)
  }, [isMarkingNew])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== TOGGLE_KEY || event.metaKey || event.ctrlKey || event.altKey || isTyping(event.target)) return
      setBarMode((mode) => (mode === 'hidden' ? 'expanded' : 'hidden'))
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <PrototypeFrameContext.Provider
      value={{
        viewer,
        setViewer,
        view,
        currentJump,
        setCurrentJump,
        handlers,
        isBarExpanded: barMode === 'expanded',
        isMarkingNew,
        setIsMarkingNew,
      }}
    >
      {/* Above the full-screen flow (z 9999), so Jump to and the rest of the bar stay usable while it's open. */}
      <ShadcnProvider dark={isDark} className="relative z-[10000]">
        {barMode === 'expanded' && <PrototypeBar onCollapse={() => setBarMode('collapsed')} />}
        {barMode === 'collapsed' && (
          <div className="fixed top-2 left-2">
            <Badge render={<button type="button" />} variant="warning" onClick={() => setBarMode('expanded')}>
              Prototype
            </Badge>
          </div>
        )}
      </ShadcnProvider>

      <div
        className={cn(
          'fixed inset-x-0 bottom-0 overflow-hidden [transform:translateZ(0)]',
          barMode === 'expanded' ? 'top-10' : 'top-0',
        )}
      >
        <div className="h-full overflow-y-auto">{children}</div>
      </div>
    </PrototypeFrameContext.Provider>
  )
}

// The topbar is only made invisible, so it keeps publishing --topbar-height, which TxModalDialog and the layer size from.
const HIDE_APP_CHROME_CSS = `
[data-testid="sidebar-container"],
[data-slot="sidebar"],
[data-slot="sidebar-gap"],
[data-slot="sidebar-container"] {
  display: none !important;
}
header[class*="@container"] {
  visibility: hidden !important;
}
`

/** The flow's logo and wallet bar; passed into the flow so it scrolls away with the page and the title can pin at the top. */
const FlowTopBar = (): ReactElement => {
  const wallet = useWallet()
  const walletName = useWalletName(wallet)

  return (
    <div className="flex h-[var(--topbar-height)] items-center px-6 pt-6 pb-4" data-m2-new="M1 copy · Flow top bar">
      <SafeLogo />
      <div className="ml-auto flex min-w-0 flex-wrap items-center gap-1 rounded-xl bg-card p-2 shadow-[0px_4px_20px_0px_rgba(0,0,0,0.03)]">
        <HeaderNavigation
          walletAddress={wallet?.address ?? ''}
          walletEns={walletName}
          isConnected={Boolean(wallet)}
          walletIcon={wallet?.icon}
          walletLabel={wallet?.label}
        />
        <HeaderAccountInfo />
      </div>
    </div>
  )
}

/** The story shell mocks TxModalContext with no flow, so the app can't hide its sidebar; this layer covers it instead. */
const FullScreenFlow = ({ children }: { children: ReactNode }): ReactElement | null => {
  const isDarkMode = useDarkMode()
  const { isBarExpanded } = usePrototypeFrame()

  useEffect(() => {
    const style = document.createElement('style')
    style.setAttribute('data-prototype', 'hide-app-chrome')
    style.textContent = HIDE_APP_CHROME_CSS
    document.head.appendChild(style)
    return () => style.remove()
  }, [])

  if (typeof document === 'undefined') return null

  // Portalled into <body> so no parent container (the prototype frame's transform, the app's stacking contexts) can trap it.
  return createPortal(
    <ShadcnProvider
      dark={isDarkMode}
      // The transform makes this layer the dialog's containing block, so it starts under this layer's own top bar.
      className={cn(
        'fixed inset-x-0 bottom-0 z-[9999] overflow-hidden [transform:translateZ(0)]',
        isBarExpanded ? 'top-10' : 'top-0',
      )}
    >
      <div className="absolute inset-0" style={{ backgroundColor: 'var(--color-background-main)' }}>
        {children}
      </div>
    </ShadcnProvider>,
    document.body,
  )
}

/** The M2 screens wired together with local state only: nothing is signed or sent. */
const GuardSetupFlowPrototype = (): ReactElement => {
  const isRulesModel = usePrototypeModel() === 'policies'
  const isSimpleModel = usePrototypeModel() === 'simple'
  // C: the policy whose intro is open, and the account it was started from (null from New).
  const [simpleIntro, setSimpleIntro] = useState<{ kind: IntroKind; accountKey: string | null } | null>(null)
  const dispatch = useAppDispatch()
  const { viewer, setViewer, view, setCurrentJump, handlers } = usePrototypeFrame()
  const [canvasFrame] = useState(getCanvasFrame)
  const [state, setState] = useState<PrototypeState>(() =>
    canvasFrame ? { ...INITIAL_STATE, ...WIZARD_DEFAULTS, ...canvasFrame.jump.state } : INITIAL_STATE,
  )
  // Bumped on Reset so the overview drops its own filters and expanded rows too.
  const [resetId, setResetId] = useState(0)
  const executionTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  // Any change made in the prototype itself moves it off the picked Jump to state, so the bar stops naming it.
  const update = useCallback(
    (patch: Partial<PrototypeState>) => {
      setState((current) => ({ ...current, ...patch }))
      setCurrentJump(null)
    },
    [setCurrentJump],
  )
  const updateFrom = (patch: (current: PrototypeState) => Partial<PrototypeState>) => {
    setState((current) => ({ ...current, ...patch(current) }))
    setCurrentJump(null)
  }

  const toast = useCallback(
    (message: string) => dispatch(showNotification({ message, variant: 'success', groupKey: 'guard-setup-prototype' })),
    [dispatch],
  )

  const stopExecution = () => clearTimeout(executionTimer.current)

  useEffect(() => {
    const timer = executionTimer
    return () => clearTimeout(timer.current)
  }, [])

  // Back to where the flow started: the policy table in By policy, the Payments panel in By account.
  // Back on the table with the new allowlist's side panel open, so its status is the first thing seen.
  // A protection set up on its own has no allowlist panel: its own panel opens instead.
  // Read from the latest state when it runs: the flow's Sign can outlive the render that picked the account.
  const getBackToPanel = (current: PrototypeState): Partial<PrototypeState> =>
    current.setupKind === 'protection' && current.setupAccountKey
      ? {
          screen: 'overview',
          panelKey: null,
          policyId: null,
          panelScenario: null,
          protectionKey: current.setupAccountKey,
        }
      : view === 'by-policy'
        ? { screen: 'overview', panelKey: null, policyId: SETUP_ROW_ID, panelScenario: null }
        : { screen: 'overview', panelKey: PAYMENTS_KEY, policyId: null }

  /** Execute: back on the overview with the panel open, Executing until the transaction is "mined", then Active. */
  const execute = () => {
    stopExecution()
    updateFrom((current) => ({ ...getBackToPanel(current), account: 'executing', dialog: undefined, wizardStep: 0 }))
    executionTimer.current = setTimeout(() => {
      update({ account: 'enforcing', justActivated: true })
    }, EXECUTION_TIME_MS)
  }

  useEffect(() => {
    handlers.current = {
      jump: ({ state: patch, viewer: jumpViewer }) => {
        stopExecution()
        setState((current) => ({
          ...current,
          policyId: null,
          panelScenario: null,
          spendingLimitState: 'normal',
          addPolicyOpen: false,
          introOpen: false,
          pendingChange: false,
          dialog: undefined,
          wizardMode: 'create',
          editInitialChoices: null,
          editRestore: null,
          editFromCreate: false,
          justActivated: false,
          protectionKey: null,
          returnToProtectionKey: null,
          pendingAccountKey: null,
          setupKind: undefined,
          ruleKind: undefined,
          ruleIsEdit: false,
          ruleReturnPolicyId: null,
          protectionEditKey: null,
          protectionEditReturn: null,
          protectionForPolicy: false,
          ...WIZARD_DEFAULTS,
          ...patch,
        }))
        // With no "Viewing as" control, a jump that names no viewer goes back to the default one.
        setViewer(jumpViewer ?? INITIAL_VIEWER)
      },
      reset: () => {
        stopExecution()
        setState(INITIAL_STATE)
        setViewer(INITIAL_VIEWER)
        setCurrentJump(null)
        setResetId((id) => id + 1)
      },
    }
  })

  // The edited row's panel stays as policyId while the wizard covers it: Close and signing both reopen it.
  const isSetupRowEdit = state.policyId === SETUP_ROW_ID

  /** Sign in edit mode: the setup's allowlist keeps the new choices as a change pending; any other account is unchanged. */
  // No toast when landing on the table: the side panel that opens already shows the new state.
  const signEdit = () => {
    update({
      screen: 'overview',
      panelKey: null,
      // The edited allowlist's panel, now showing the pending change.
      policyId: state.policyId,
      panelScenario: null,
      ...EDIT_ENDED,
      ...(isSetupRowEdit ? { pendingChange: true } : (state.editRestore ?? {})),
    })
  }

  const closeWizard = () =>
    state.wizardMode === 'edit'
      ? update({
          screen: 'overview',
          panelKey: null,
          // An edit started from Create had no panel open, so closing goes back to the plain table.
          ...(state.editFromCreate ? { policyId: null } : {}),
          ...EDIT_ENDED,
          ...(state.editRestore ?? {}),
        })
      : updateFrom(getBackToPanel)

  /** Edit in a live allowlist's panel: the create flow on that account, starting from the allowlist as it is. */
  /** A live allowlist's tokens and recipients as form choices: for Edit, and for Create on an account that has one. */
  const choicesFromAllowlist = (row: PolicyRow): SetupChoices =>
    row.id === SETUP_ROW_ID
      ? state.choices
      : {
          recipients: row.people.map(({ name, address }) => ({ name, address, selected: true })),
          addedTokens: [],
          keptConflicts: [],
          blockedSettings: [],
          ...getAllowlistSettings(row.account),
        }

  /** Picking an account with an allowlist prefills its current rules; leaving it starts over with an empty form. */
  const pickSetupAccount = (account: M2Account) => {
    // Protection on its own: the field stays on How it works, and protected accounts can't be picked.
    if (state.setupKind === 'protection' || state.setupKind === 'rule') {
      update({ setupAccountKey: getAccountKey(account) })
      return
    }
    const existing = getPolicyRows(payments).find(
      (row) => row.type === 'allowlist' && getAccountKey(row.account) === getAccountKey(account),
    )
    // An account with an allowlist turns the setup into an edit of it, prefilled, the account still changeable.
    if (existing) {
      const liveChoices = choicesFromAllowlist(existing)
      update({
        setupAccountKey: getAccountKey(account),
        wizardMode: 'edit',
        editFromCreate: true,
        policyId: existing.id,
        choices: liveChoices,
        editInitialChoices: liveChoices,
        editRestore: state.editFromCreate ? state.editRestore : { setupAccountKey: null, choices: FRESH_CHOICES },
      })
      return
    }
    // Single policies don't need account protection: the allowlist is set up on its own.
    update({
      setupAccountKey: getAccountKey(account),
      ...(state.editFromCreate ? { ...EDIT_ENDED, policyId: null, choices: FRESH_CHOICES } : {}),
    })
  }

  /** B: one rule on its own, added from the account's row or edited from its panel; the flow runs on that account. */
  const startRuleChange = (account: M2Account | null, ruleKind: SingleRuleKind, isEdit = false) =>
    update({
      screen: 'wizard',
      setupKind: 'rule',
      ruleKind,
      ruleIsEdit: isEdit,
      ruleReturnPolicyId: isEdit ? state.policyId : null,
      wizardMode: 'create',
      wizardStep: { allowlist: CREATE_STEP, settings: SETTINGS_STEP, limits: POLICIES_STEP, proposers: PROPOSERS_STEP }[
        ruleKind
      ],
      setupAccountKey: account ? getAccountKey(account) : null,
      setupFromRow: Boolean(account),
      ...(isSimpleModel && { choices: FRESH_CHOICES }),
      policyId: null,
      panelKey: null,
      protectionKey: null,
      addPolicyOpen: false,
    })

  const endRuleChange = () =>
    update({
      screen: 'overview',
      setupKind: undefined,
      ruleKind: undefined,
      ruleIsEdit: false,
      policyId: state.ruleReturnPolicyId ?? null,
      ruleReturnPolicyId: null,
      wizardStep: 0,
    })

  const editAllowlist = (row: PolicyRow) => {
    const initialChoices = choicesFromAllowlist(row)

    update({
      screen: 'wizard',
      wizardMode: 'edit',
      wizardStep: CREATE_STEP,
      panelKey: null,
      addPolicyOpen: false,
      setupAccountKey: getAccountKey(row.account),
      choices: initialChoices,
      editInitialChoices: initialChoices,
      editRestore: { setupAccountKey: state.setupAccountKey, choices: state.choices },
    })
  }

  /** The first signature creates the transaction; one that completes the threshold goes on to Execute. */
  const sign = () => {
    if (state.wizardMode === 'edit') {
      signEdit()
      return
    }

    const isNewSetup = state.account === 'not-set-up'
    const signedBy = isNewSetup
      ? [viewer]
      : state.signedBy.includes(viewer)
        ? state.signedBy
        : [...state.signedBy, viewer]

    // Only when the flow goes on to Execute; landing on the table, the opened side panel shows the new state.
    if (signedBy.length >= setupTarget.threshold) {
      toast(isNewSetup ? 'Successfully added to queue.' : 'Successfully signed.')
      update({ account: 'ready', signedBy, wizardStep: EXECUTE_STEP })
      return
    }

    updateFrom((current) => ({ ...getBackToPanel(current), account: 'waiting', signedBy, wizardStep: 0 }))
  }

  const otherAccount = OTHER_ACCOUNTS.find(({ account }) => getAccountKey(account) === state.panelKey)
  const isPaymentsPanel = state.panelKey === PAYMENTS_KEY
  const setupAccount = state.setupAccountKey ? findM2Account(state.setupAccountKey) : undefined
  const setupTarget = setupAccount ?? PAYMENTS
  const isPaymentsSetup = getAccountKey(setupTarget) === PAYMENTS_KEY
  const selectedRecipients = state.choices.recipients.filter(({ selected }) => selected)
  const payments: PaymentsSnapshot = {
    state: state.account,
    signedCount: state.signedBy.length,
    pendingChange: state.pendingChange,
    // The "Failed", "Replaced" and "Deleted" side panel states also mark the table row, so both read Failed.
    failed: Boolean(state.panelScenario?.outcome && state.panelScenario.outcome !== 'executed'),
    account: setupTarget,
    recipients: selectedRecipients.map(({ name, address }) => ({ name, address })),
    spendingLimit: state.spendingLimitState,
    // Protection always comes with its allowlist now, so the row is a real allowlist; in C it's the enforcement alone.
    protectionOnly: isSimpleModel,
    // An allowlist added from New on its own leaves the account not enforced.
    singlePolicy: state.setupKind === 'policy',
    // B's test set: five Safe accounts, none with policy enforcement until Jump to turns Trading desk's on.
    testAccounts: isRulesModel || isSimpleModel,
    simple: isSimpleModel,
    tradingDeskEnforced: !(isRulesModel || isSimpleModel) || Boolean(state.tradingDeskEnforced),
    // The setup's own choices, then whatever an edit saved, so the account settings row says what's blocked.
    blockedSettings: {
      ...(state.setupAccountKey ? { [state.setupAccountKey]: state.choices.blockedSettings } : {}),
      ...Object.fromEntries(
        Object.entries(state.protectionRulesByAccount ?? {}).map(([key, rules]) => [key, rules.blockedSettings]),
      ),
    },
  }
  // The account view follows Payments only, so a setup on another account leaves Payments not protected there.
  const paymentsForAccountView: PaymentsSnapshot = isPaymentsSetup
    ? payments
    : { ...payments, state: 'not-set-up', signedCount: 0, pendingChange: false }
  const paymentsPanelState = paymentsForAccountView.state
  const openPanel = (account: M2Account) => update({ panelKey: getAccountKey(account), dialog: undefined })
  // The setup's own account follows the prototype's choices; every other protected account uses the default rules.
  const isSetupProtection = Boolean(state.protectionKey) && state.protectionKey === state.setupAccountKey
  const getProtectionRules = (accountKey: string | null): ProtectionRules =>
    (accountKey && state.protectionRulesByAccount?.[accountKey]) ||
    (accountKey && accountKey === state.setupAccountKey
      ? { baseline: state.choices.baseline ?? 'block-all', blockedSettings: state.choices.blockedSettings }
      : DEFAULT_PROTECTION_RULES)
  const protectionRules = getProtectionRules(state.protectionKey ?? null)
  /** Edit: Settings, Everything else, Review, then sign and execute; the change waits 24 hours. */
  const editProtection = (account: M2Account, rules: ProtectionRules) =>
    update({
      screen: 'wizard',
      setupKind: 'protection-edit',
      protectionEditKey: getAccountKey(account),
      protectionEditReturn: { choices: state.choices, setupKind: state.setupKind },
      wizardMode: 'create',
      wizardStep: SETTINGS_STEP,
      protectionKey: null,
      choices: { ...state.choices, baseline: rules.baseline, blockedSettings: rules.blockedSettings },
    })
  /** Back to the protection's panel, the setup's own choices put back; `saved` keeps the edit's rules. */
  const endProtectionEdit = (saved: boolean) => {
    const key = state.protectionEditKey ?? null
    update({
      screen: 'overview',
      protectionKey: key,
      ...(saved && key
        ? {
            protectionChangeKey: key,
            protectionRulesByAccount: {
              ...state.protectionRulesByAccount,
              [key]: {
                baseline: state.choices.baseline ?? 'block-all',
                blockedSettings: state.choices.blockedSettings,
              },
            },
          }
        : {}),
      ...(state.protectionEditReturn ?? {}),
      protectionEditKey: null,
      protectionEditReturn: null,
    })
  }
  const openWizardAt = (wizardStep: number) =>
    update({ screen: 'wizard', panelKey: null, policyId: null, panelScenario: null, addPolicyOpen: false, wizardStep })
  const openPolicy = (row: PolicyRow) =>
    update({
      policyId: row.id,
      protectionKey: null,
      returnToProtectionKey: null,
      panelKey: null,
      panelScenario: null,
      dialog: undefined,
    })
  const openProtection = (account: M2Account) =>
    update({
      protectionKey: getAccountKey(account),
      returnToProtectionKey: null,
      policyId: null,
      panelKey: null,
      panelScenario: null,
    })
  // Into a policy from the enforcement panel and back out: the panels push sideways, like pages.
  const [slide, setSlide] = useState<'forward' | 'back' | null>(null)
  // Set before the panels swap, so the new one never plays its own slide-in; cleared once the push is done.
  const startSlide = (direction: 'forward' | 'back') => {
    document.documentElement.dataset.m2Slide = direction
    setSlide(direction)
  }
  useEffect(() => {
    if (!slide) return
    const timer = setTimeout(() => {
      delete document.documentElement.dataset.m2Slide
      setSlide(null)
    }, 400)
    return () => clearTimeout(timer)
  }, [slide])
  const openPolicyFromProtection = (row: PolicyRow) => {
    startSlide('forward')
    update({
      policyId: row.id,
      protectionKey: null,
      returnToProtectionKey: state.protectionKey ?? null,
      panelKey: null,
      panelScenario: null,
      dialog: undefined,
    })
  }
  const backToProtection = state.returnToProtectionKey
    ? () => {
        startSlide('back')
        update({
          protectionKey: state.returnToProtectionKey,
          returnToProtectionKey: null,
          policyId: null,
          panelScenario: null,
        })
      }
    : undefined
  const panelOrder = getPanelOrder(getPolicyRows(payments))
  const panelIndex = panelOrder.findIndex((entry) =>
    entry.kind === 'protection' ? entry.accountKey === state.protectionKey : entry.id === state.policyId,
  )
  const openEntry = (entry?: PanelEntry) =>
    entry &&
    (() =>
      entry.kind === 'protection'
        ? update({
            protectionKey: entry.accountKey,
            returnToProtectionKey: null,
            policyId: null,
            panelKey: null,
            panelScenario: null,
          })
        : update({
            policyId: entry.id,
            returnToProtectionKey: null,
            protectionKey: null,
            panelKey: null,
            panelScenario: null,
          }))
  const panelNav: PanelNav = {
    onPrevious: panelIndex > 0 ? openEntry(panelOrder[panelIndex - 1]) : undefined,
    onNext: panelIndex >= 0 ? openEntry(panelOrder[panelIndex + 1]) : undefined,
  }
  const policyPanelNav: PanelNav = { ...panelNav, onBack: state.policyId ? backToProtection : undefined }
  const protectionAccount = state.protectionKey ? findM2Account(state.protectionKey) : undefined
  const openRow = getPolicyRows(payments).find(({ id }) => id === state.policyId)
  const isSetupRow = openRow?.id === SETUP_ROW_ID
  // Only the allowlist panel's Edit is wired; M1's spending limit and proposer panels keep theirs unset.
  const openAllowlistRow = openRow?.type === 'allowlist' ? openRow : undefined

  /** A fresh setup, opening on the onboarding: from "New" without an account, from an account's row with that one. */
  const startAllowlist = (accountKey: string | null = state.pendingAccountKey) =>
    update({
      setupAccountKey: accountKey,
      setupFromRow: accountKey !== null,
      setupKind: 'protection',
      protectionForPolicy: false,
      pendingAccountKey: null,
      ...WIZARD_DEFAULTS,
      ...EDIT_ENDED,
      choices: FRESH_CHOICES,
      screen: 'wizard',
      addPolicyOpen: false,
      introOpen: false,
      panelKey: null,
      policyId: null,
      // C enforces the account's live policies as they are, so it goes straight to Review.
      wizardStep: isSimpleModel ? REVIEW_STEP : SETTINGS_STEP,
      account: 'not-set-up',
      signedBy: [],
      pendingChange: false,
    })

  /** Every Enforce policies entry opens the intro modal first; its button starts the flow for that account. */
  const openEnforceIntro = (accountKey: string | null) =>
    update({
      introOpen: true,
      pendingAccountKey: accountKey,
      addPolicyOpen: false,
      protectionKey: null,
      policyId: null,
    })

  return (
    <>
      <style>{PANEL_SLIDE_CSS}</style>
      {view === 'by-account' ? (
        <PoliciesOverviewPage
          key={resetId}
          payments={paymentsForAccountView}
          defaultExpanded={canvasFrame?.expanded ?? [PAYMENTS.address]}
          onSelectAccount={openPanel}
        />
      ) : (
        <PoliciesByPolicyPage
          key={resetId}
          levels
          simple={isSimpleModel}
          payments={payments}
          initialFilters={canvasFrame?.policyFilters}
          activeRowId={state.policyId ?? undefined}
          // B starts from an account's row: Set up, Add policies, or Add rule; there is no New.
          onAddPolicy={
            isRulesModel ? undefined : () => update({ addPolicyOpen: true, policyId: null, pendingAccountKey: null })
          }
          onSelectAccount={openPanel}
          onSelectPolicy={openPolicy}
          // The onboarding's first step explains protection, so the row goes straight in, without the old intro dialog.
          onProtectAccount={(account) => openEnforceIntro(getAccountKey(account))}
          onOpenProtection={openProtection}
          // An account with no policies: Set up policies, already on that account.
          onAddRule={isRulesModel ? (account, rule) => startRuleChange(account, rule) : undefined}
          onAddPolicies={(account) =>
            isRulesModel
              ? openEnforceIntro(getAccountKey(account))
              : update({ addPolicyOpen: true, policyId: null, pendingAccountKey: getAccountKey(account) })
          }
        />
      )}

      <SimplePolicyChooser
        open={isSimpleModel && state.screen === 'overview' && state.addPolicyOpen}
        onOpenChange={(addPolicyOpen) => update({ addPolicyOpen })}
        onEnforce={() => openEnforceIntro(state.pendingAccountKey)}
        onSelect={(kind) => {
          setSimpleIntro({ kind, accountKey: state.pendingAccountKey })
          update({ addPolicyOpen: false })
        }}
        onSuggest={() => update({ addPolicyOpen: false })}
      />

      {simpleIntro && (
        <PolicyIntro
          open
          kind={simpleIntro.kind}
          onOpenChange={(open) => (open ? undefined : setSimpleIntro(null))}
          // Contract interactions has no flow yet: its intro is as far as it goes.
          onProceed={() => {
            const { kind, accountKey } = simpleIntro
            setSimpleIntro(null)
            if (kind !== 'contracts') startRuleChange(accountKey ? (findM2Account(accountKey) ?? null) : null, kind)
          }}
        />
      )}

      <LevelsAddPolicyChooser
        open={!isSimpleModel && state.screen === 'overview' && state.addPolicyOpen}
        onOpenChange={(addPolicyOpen) => update({ addPolicyOpen })}
        // The same flow as a row's Set up, with the account picked inside it.
        onSetUpProtection={() => openEnforceIntro(state.pendingAccountKey)}
        // M1's spending limit and proposer tiles just close the dialog.
        onSelect={() => update({ addPolicyOpen: false })}
        protectedCount={getAllowlistAccountKeys(payments).length}
        accountCount={new Set(getPolicyRows(payments).map(({ account }) => getAccountKey(account))).size}
      />

      <AllowlistIntroDialog
        open={state.screen === 'overview' && state.introOpen}
        onOpenChange={(open) => (open ? undefined : update({ introOpen: false }))}
        onProceed={() => startAllowlist()}
      />

      <PolicyDrawer
        open={state.screen === 'overview' && Boolean(openRow)}
        row={openRow}
        viewerHasSigned={isSetupRow && state.signedBy.includes(viewer)}
        scenario={isSetupRow ? (state.panelScenario ?? undefined) : undefined}
        spendingLimitBlockedTokens={BLOCKED_SPENDING_LIMIT_TOKENS}
        paymentsExcludedTokens={state.choices.excludedTokens}
        justActivated={isSetupRow && state.justActivated}
        allRows={getPolicyRows(payments)}
        protectedAccountKeys={getAllowlistAccountKeys(payments)}
        onSelectPolicy={openPolicy}
        onClose={() =>
          update({ policyId: null, returnToProtectionKey: null, panelScenario: null, justActivated: false })
        }
        nav={policyPanelNav}
        // Only the new allowlist is driven by the prototype: Confirm reviews it, Execute opens the execute step.
        onConfirm={isSetupRow ? () => openWizardAt(REVIEW_STEP) : undefined}
        onExecute={isSetupRow ? () => openWizardAt(EXECUTE_STEP) : undefined}
        onCancelChange={() => (isSetupRow ? update({ pendingChange: false }) : undefined)}
        accountSettingsRules={openRow && getProtectionRules(getAccountKey(openRow.account))}
        onEdit={
          openAllowlistRow
            ? () => editAllowlist(openAllowlistRow)
            : openRow?.type === 'account-settings'
              ? () => editProtection(openRow.account, getProtectionRules(getAccountKey(openRow.account)))
              : isRulesModel && openRow?.type === 'spending-limit'
                ? () => startRuleChange(openRow.account, 'limits', true)
                : undefined
        }
        // "See policy here" on a blocked spending limit: swap to the allowlist row on the same account.
        onOpenAllowlist={(account) => {
          const allowlistRow = getPolicyRows(payments).find(
            (row) => row.type === 'allowlist' && getAccountKey(row.account) === getAccountKey(account),
          )
          if (allowlistRow) update({ policyId: allowlistRow.id, panelScenario: null })
        }}
        onOpenProtection={openProtection}
      />

      <ProtectionDrawer
        open={state.screen === 'overview' && Boolean(protectionAccount)}
        account={protectionAccount}
        allRows={getPolicyRows(payments)}
        onSelectPolicy={openPolicyFromProtection}
        onClose={() => update({ protectionKey: null })}
        levels
        nav={panelNav}
        rules={protectionRules}
        viewerHasSigned={isSetupProtection && state.signedBy.includes(viewer)}
        changePending={Boolean(state.protectionKey) && state.protectionChangeKey === state.protectionKey}
        // Only the prototype's own setup is driven: Confirm reviews it, Execute opens the execute step.
        onConfirm={isSetupProtection ? () => openWizardAt(REVIEW_STEP) : undefined}
        onExecute={isSetupProtection ? () => openWizardAt(EXECUTE_STEP) : undefined}
        onCancelChange={() => update({ protectionChangeKey: null })}
        onEditProtection={protectionAccount ? () => editProtection(protectionAccount, protectionRules) : undefined}
        onEnforce={protectionAccount ? () => openEnforceIntro(getAccountKey(protectionAccount)) : undefined}
      />

      {otherAccount ? (
        <AccountPanel
          open={state.screen === 'overview'}
          account={otherAccount.account}
          state={otherAccount.state}
          onClose={() => update({ panelKey: null })}
        />
      ) : (
        <AccountPanel
          open={state.screen === 'overview' && isPaymentsPanel}
          account={PAYMENTS}
          // The allowlist setup never removes the Ops bot limit.
          hasSpendingLimit
          activeDetails={getActiveDetails(state.choices)}
          state={paymentsPanelState}
          signedCount={paymentsForAccountView.signedCount}
          pendingChange={paymentsForAccountView.pendingChange}
          dialog={state.dialog}
          onClose={() => update({ panelKey: null, dialog: undefined })}
          // From Payments' panel, the dropdown starts on Payments.
          onSetUp={() =>
            update({
              ...WIZARD_DEFAULTS,
              screen: 'wizard',
              panelKey: null,
              wizardStep: 0,
              setupAccountKey: PAYMENTS_KEY,
              account: 'not-set-up',
              signedBy: [],
            })
          }
          // The signer who has not signed yet (e.g. Tom) reviews the same setup and confirms it.
          onReview={() => openWizardAt(REVIEW_STEP)}
          onReject={() => update({ dialog: 'reject' })}
          onCreateRejection={() => update({ account: 'not-set-up', signedBy: [], dialog: undefined })}
          onOpenExecute={() => openWizardAt(EXECUTE_STEP)}
          onRetryExecute={() => openWizardAt(EXECUTE_STEP)}
          onCloseDialog={() => update({ dialog: undefined })}
          onCancelChange={() => update({ pendingChange: false })}
        />
      )}

      {state.screen === 'wizard' && (
        <FullScreenFlow>
          <SetUpPoliciesFlow
            account={
              state.setupKind === 'protection-edit' && state.protectionEditKey
                ? findM2Account(state.protectionEditKey)
                : setupAccount
            }
            onAccountChange={pickSetupAccount}
            step={state.wizardStep}
            onStepChange={(wizardStep) => update({ wizardStep })}
            choices={state.choices}
            onChoicesChange={(choices) => update({ choices })}
            preflight={state.preflight}
            viewer={viewer}
            // Editing protection: one signature in the prototype, then Execute starts the 24-hour wait.
            onSign={
              state.setupKind === 'protection-edit' || state.setupKind === 'rule'
                ? () => update({ wizardStep: EXECUTE_STEP })
                : sign
            }
            onExecute={
              state.setupKind === 'protection-edit'
                ? () => endProtectionEdit(true)
                : state.setupKind === 'rule'
                  ? endRuleChange
                  : execute
            }
            onClose={
              state.setupKind === 'protection-edit'
                ? () => endProtectionEdit(false)
                : state.setupKind === 'rule'
                  ? endRuleChange
                  : closeWizard
            }
            mode={state.wizardMode}
            isAccountLocked={state.wizardMode === 'edit' && !state.editFromCreate}
            accountFromRow={
              (state.setupFromRow && state.wizardMode === 'create') ||
              state.setupKind === 'protection-edit' ||
              (state.setupKind === 'rule' && state.setupFromRow)
            }
            kind={state.setupKind ?? 'policy'}
            ruleKind={state.ruleKind}
            isRuleEdit={state.ruleIsEdit}
            forPolicy={state.protectionForPolicy}
            livePolicies={
              setupAccount &&
              getPolicyRows(payments)
                .filter((row) => getAccountKey(row.account) === getAccountKey(setupAccount) && row.status !== 'failed')
                .sort((a, b) => LIVE_POLICY_ORDER.indexOf(a.type) - LIVE_POLICY_ORDER.indexOf(b.type))
                .map(({ id, type, summary }) => ({
                  id,
                  Icon: POLICY_TYPES[type].Icon,
                  title: POLICY_ROW_LABELS[type],
                  summary,
                }))
            }
            disabledAccountKeys={state.setupKind === 'protection' ? getAllowlistAccountKeys(payments) : undefined}
            initialChoices={state.editInitialChoices ?? undefined}
            topBar={<FlowTopBar />}
          />
          {/* The wizard layer covers the page's toasts, so it shows its own while it's open. */}
          <div data-m2-toasts="">
            <Notifications />
          </div>
        </FullScreenFlow>
      )}

      {state.screen !== 'wizard' && (
        <div data-m2-toasts="">
          <Notifications />
        </div>
      )}
    </>
  )
}

/** While moving between the enforcement panel and a policy's: no panel slide-in, the content pushes sideways instead. */
const PANEL_SLIDE_CSS = `
html[data-m2-slide] [data-slot=sheet-content], html[data-m2-slide] [data-slot=sheet-overlay] { animation: none !important; transition: none !important; }
html[data-m2-slide] [data-slot=sheet-content][data-closed] { display: none; }
@keyframes m2-push-from-right { from { transform: translateX(48px); opacity: 0; } to { transform: none; opacity: 1; } }
@keyframes m2-push-from-left { from { transform: translateX(-48px); opacity: 0; } to { transform: none; opacity: 1; } }
html[data-m2-slide=forward] [data-slot=sheet-content] > div:first-child { animation: m2-push-from-right 240ms ease-out; }
html[data-m2-slide=back] [data-slot=sheet-content] > div:first-child { animation: m2-push-from-left 240ms ease-out; }
`

const shell = createPoliciesM2Story({ wallet: 'owner', store: WIZARD_STORE, notifications: false })

const withPrototypeFrame: Decorator = (Story, context) => (
  <PrototypeFrame isDark={context.globals?.theme === 'dark'}>{shell.decorator(Story, context)}</PrototypeFrame>
)

const meta = {
  title: 'Prototype/Policies M2 – full flow',
  component: GuardSetupFlowPrototype,
  decorators: [withPrototypeFrame],
  // Shared with the All states canvas, not stories.
  excludeStories: ['CANVAS_PARAM', 'CANVAS_ROWS', 'MARK_NEW_PARAM'],
  parameters: {
    ...shell.parameters,
    msw: { handlers: [...SETUP_PREVIEW_HANDLERS, ...shell.parameters.msw.handlers] },
  },
} satisfies Meta<typeof GuardSetupFlowPrototype>

export default meta
type Story = StoryObj<typeof meta>

/** Overview → side panel → Create … Confirm → Change pending → second signer → Execute → Active, in local state only. */
export const PoliciesM2FullFlow: Story = {
  name: 'A · Account protection + other policies (29 Oct)',
}

// B's name for the one thing you set up, in place of A's "account protection".
const B_TERMS: [RegExp, string][] = [
  [/Account protection/g, 'Policy enforcement'],
  [/account protection/g, 'policy enforcement'],
]

const LIVE_POLICY_ORDER: PolicyRow['type'][] = ['account-settings', 'allowlist', 'spending-limit', 'proposer']

// C also names the account settings policy "Settings lock", wherever it's the policy's name on its own.
const C_TERMS: [RegExp, string][] = [...B_TERMS, [/^Account settings$/, 'Settings lock']]

const renameTerms = (text: string, terms: [RegExp, string][]): string =>
  terms.reduce((next, [pattern, replacement]) => next.replace(pattern, replacement), text)

const rewriteNode = (node: Node, terms: [RegExp, string][]): void => {
  const text = node.nodeValue ?? ''
  const renamed = renameTerms(text, terms)
  if (renamed !== text) node.nodeValue = renamed
}

const rewriteTerms = (root: Node, terms: [RegExp, string][]): void => {
  // React updates text in place, so a characterData mutation's target is the text node itself.
  if (root.nodeType === Node.TEXT_NODE) return rewriteNode(root, terms)
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  for (let node = walker.nextNode(); node; node = walker.nextNode()) rewriteNode(node, terms)
}

/** Renames account protection to policy enforcement on screen, so B and C share A's screens and only the model differs. */
const BTerms = ({ children, terms = B_TERMS }: { children: ReactNode; terms?: [RegExp, string][] }): ReactElement => {
  useEffect(() => {
    rewriteTerms(document.body, terms)
    const observer = new MutationObserver((mutations) =>
      mutations.forEach((mutation) => rewriteTerms(mutation.target, terms)),
    )
    observer.observe(document.body, { subtree: true, childList: true, characterData: true })
    return () => observer.disconnect()
  }, [terms])

  return <>{children}</>
}

/**
 * B: one account policies per account, every module a rule inside it. The warning modal still comes first; only the
 * allowlist is required, spending limits and proposers are an optional step, pre-filled when the account has some.
 */
export const AccountPoliciesWithRules: Story = {
  name: 'B · Policy enforcement with policies inside (30 Oct)',
  decorators: [
    (Story) => (
      <PrototypeModelContext.Provider value="policies">
        <BTerms>
          <Story />
        </BTerms>
      </PrototypeModelContext.Provider>
    ),
  ],
}

/** C: no container, every policy on its own; New lists them all and each account shows its policies underneath. */
export const SimplePolicies: Story = {
  name: 'C · Simple policies, one at a time (30 Oct)',
  decorators: [
    (Story) => (
      <PrototypeModelContext.Provider value="simple">
        <BTerms terms={C_TERMS}>
          <Story />
        </BTerms>
      </PrototypeModelContext.Provider>
    ),
  ],
}

const VERSIONS: { date: string; title: string; href: string; note: string }[] = [
  {
    date: '21 Oct',
    title: 'Allowlist with account settings',
    href: 'https://design-policies-m2--walletweb.review.5afe.dev/storybook/?path=/story/prototype-policies-m2-full-flow--policies-m-2-full-flow',
    note: 'Frozen preview of that day’s branch.',
  },
  {
    date: '29 Oct',
    title: 'Edit panels and banners',
    href: 'https://design-policies-m2-edit-panels--walletweb.review.5afe.dev/storybook/?path=/story/prototype-policies-m2-full-flow--policies-m-2-full-flow',
    note: 'Frozen preview of that day’s branch.',
  },
  {
    date: '29 Oct',
    title: 'Single policies + policy enforcement (as presented at 13:30)',
    href: '?path=/story/prototype-policies-archive-29-oct-13-30-policy-enforcement--policies-m-2-full-flow',
    note: 'Frozen copy in this Storybook.',
  },
  {
    date: '29 Oct',
    title: 'A · Account protection + other policies, with the allow fallback',
    href: '?path=/story/prototype-policies-m2-full-flow--policies-m-2-full-flow',
    note: 'In this Storybook.',
  },
  {
    date: '30 Oct',
    title: 'B · Policy enforcement with policies inside',
    href: '?path=/story/prototype-policies-m2-full-flow--account-policies-with-rules',
    note: 'In this Storybook.',
  },
  {
    date: '30 Oct',
    title: 'C · Simple policies, one at a time',
    href: '?path=/story/prototype-policies-m2-full-flow--simple-policies',
    note: 'In this Storybook.',
  },
]

/** Every version worth going back to, newest last, with where to open it. */
export const VersionHistory: Story = {
  name: 'Version history',
  render: () => (
    <div className="mx-auto flex max-w-2xl flex-col gap-3 p-8">
      <Typography variant="h3">Policies prototype versions</Typography>
      {VERSIONS.map(({ date, title, href, note }) => (
        <a
          key={title}
          href={href}
          target="_top"
          className="flex items-center gap-4 rounded-lg bg-muted p-4 transition-colors hover:bg-secondary-hover"
        >
          <Badge variant="subtle" shape="tag" className="shrink-0">
            {date}
          </Badge>
          <span className="flex min-w-0 flex-1 flex-col">
            <Typography variant="paragraph-small-medium">{title}</Typography>
            <Typography variant="paragraph-mini" color="muted">
              {note}
            </Typography>
          </span>
          <ArrowRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        </a>
      ))}
    </div>
  ),
}
