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
import { ArrowRight, Check, ChevronDown, ChevronUp, FileCode2, Users } from 'lucide-react'
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
import AddPolicyOptionButton from '@safe-global/views/features/spaces/components/Policies/AddPolicyDialog/AddPolicyOptionButton'
import {
  ADD_POLICY_OPTIONS,
  type AddPolicyOption,
} from '@safe-global/views/features/spaces/components/Policies/AddPolicyDialog/options'
import { AccountPanel, type AccountDialog, type AccountState } from './m2AccountPanel'
import {
  getAllowlistAccountKeys,
  getPolicyRows,
  PoliciesByPolicyPage,
  PoliciesOverviewPage,
  SETUP_ROW_ID,
  type PaymentsSnapshot,
  type PolicyFilters,
  type PolicyRow,
  type SpendingLimitState,
} from './m2OverviewPage'
import { AllowlistIntroDialog } from './m2AllowlistIntro'
import { PolicyDrawer, ProtectionDrawer, type AllowlistPanelScenario } from './m2PolicyDrawers'
import {
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
} from './m2Prototype'
import {
  ACCOUNT_SETTING_GROUPS,
  CONFIRM_STEP,
  CREATE_STEP,
  INTRO_STEP,
  DEFAULT_CHOICES,
  EXECUTE_STEP,
  findM2Account,
  getActiveDetails,
  PERMISSIONS_STEP,
  POPULAR_TOKENS,
  SETTINGS_STEP,
  REVIEW_STEP,
  SETUP_PREVIEW_HANDLERS,
  SetUpPoliciesFlow,
  WIZARD_STORE,
  type Preflight,
  type Recipient,
  type SetupChoices,
  type WizardMode,
} from './m2SetupFlow'

// AddPolicyDialog only takes its own policy ids, so the allowlist tile borrows `recovery`, which M1 doesn't offer yet.
const ALLOWLIST_OPTION_ID: AddPolicyOption['id'] = 'recovery'

/** Every policy in one list, as Dev asked: the allowlist is a policy like the others. Picking an account without
 * protection opens the onboarding first; on a protected account it's the short wizard. */
const POLICY_OPTIONS: AddPolicyOption[] = [
  {
    id: ALLOWLIST_OPTION_ID,
    title: 'Allowlist',
    description: 'Only send chosen tokens to chosen recipients. The first time, it also sets up account protection.',
    Icon: Users,
  },
  {
    id: 'suggestion',
    title: 'Contract interactions',
    description: 'Coming soon · Only allow chosen apps, down to the actions they can take.',
    Icon: FileCode2,
    disabled: true,
    disabledTooltip: 'Coming soon',
  },
  ...ADD_POLICY_OPTIONS.filter(({ id }) => id !== 'suggestion'),
]
const SUGGESTION_OPTION = ADD_POLICY_OPTIONS.find(({ id }) => id === 'suggestion')

/** M1's Add policy dialog, one column: the allowlist first, then M1's policies. */
const AddPolicyChooser = ({
  open,
  onOpenChange,
  onSelect,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (id: AddPolicyOption['id']) => void
}): ReactElement => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent size="default" data-testid="add-policy-dialog">
      <DialogHeader>
        <DialogTitle className="text-xl leading-6 font-semibold">Add policy</DialogTitle>
      </DialogHeader>

      <div className="flex flex-col gap-6 px-4 pb-4" data-m2-new="New · Add policy list">
        <div className="grid gap-2">
          {POLICY_OPTIONS.map((option) => (
            <AddPolicyOptionButton
              key={option.title}
              {...option}
              onClick={option.disabled ? undefined : () => onSelect(option.id)}
            />
          ))}
        </div>

        {/* A quiet footer line, not a tile: it's feedback, not something to set up. */}
        {SUGGESTION_OPTION && (
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
        )}
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
const CONFLICT_TWO: SetupChoices = { ...DEFAULT_CHOICES, excludedTokens: ['USDC', 'ETH'] }
const CONFLICT_ONE_EXEMPT: SetupChoices = { ...CONFLICT_ONE, applyToSpendingLimits: false }
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
    heading: 'Set up account protection',
    jumps: [
      { label: 'How it works', state: { ...WIZARD, wizardStep: 0, choices: FRESH_CHOICES } },
      { label: 'Create', state: { ...WIZARD, wizardStep: CREATE_STEP, choices: FRESH_CHOICES } },
      {
        label: 'Create · 20 tokens, 20 recipients',
        state: { ...WIZARD, wizardStep: CREATE_STEP, choices: MANY_TOKENS_CHOICES },
      },
      { label: 'Policies', state: { ...WIZARD, wizardStep: PERMISSIONS_STEP } },
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
      { label: 'Account already protected', view: 'by-policy', state: { ...EDIT, editFromCreate: true } },
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
      allowlistPanel(
        'Active · spending limits not covered',
        { ...LIVE_SETUP, choices: { ...DEFAULT_CHOICES, applyToSpendingLimits: false } },
        { viewer: 'signer' },
      ),
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
        id: 'drawer-allowlist-not-covered',
        label: 'Account protection · Active, spending limits not covered',
        jump: {
          view: BY_POLICY,
          state: {
            ...POLICY_TABLE,
            policyId: SETUP_ROW_ID,
            account: 'enforcing',
            ...FULLY_SIGNED,
            choices: { ...DEFAULT_CHOICES, applyToSpendingLimits: false },
          },
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
        label: 'Spending limit · Blocked by protection (Payments)',
        jump: { view: BY_POLICY, state: SPENDING_LIMIT_BLOCKED },
      },
      {
        id: 'drawer-spending-limit-locked',
        label: 'Spending limit · Locked by protection (Payments)',
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
        label: 'Account already protected (edit)',
        jump: { view: 'by-policy', state: { ...EDIT, editFromCreate: true } },
      },
    ],
  },
  {
    title: 'Policies',
    frames: [
      { id: 'permissions', label: 'Payments', jump: { state: { ...WIZARD, wizardStep: PERMISSIONS_STEP } } },
      {
        id: 'permissions-conflict-one',
        label: 'Policies · Spending limit conflict',
        jump: { state: { ...WIZARD, wizardStep: PERMISSIONS_STEP, choices: CONFLICT_ONE } },
      },
      {
        id: 'permissions-conflict-two',
        label: 'Policies · Spending limit conflict (2)',
        jump: { state: { ...WIZARD, wizardStep: PERMISSIONS_STEP, choices: CONFLICT_TWO } },
      },
      {
        id: 'permissions-spending-limits-exempt',
        label: 'Policies · Spending limits exempt',
        jump: { state: { ...WIZARD, wizardStep: PERMISSIONS_STEP, choices: CONFLICT_ONE_EXEMPT } },
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
  /** The policies table: grouped by Safe account, or one flat list of policies (the team's alternative). */
  tableLayout: TableLayout
  setTableLayout: (layout: TableLayout) => void
}

type TableLayout = 'by-account' | 'policy-list'

const TABLE_LAYOUTS: { value: TableLayout; label: string }[] = [
  { value: 'by-account', label: 'By account' },
  { value: 'policy-list', label: 'Policy list' },
]

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
  const { currentJump, setCurrentJump, handlers, isMarkingNew, setIsMarkingNew, tableLayout, setTableLayout } =
    usePrototypeFrame()
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

      <div className="flex shrink-0 items-center gap-1" role="group" aria-label="Table layout">
        <Typography variant="paragraph-mini" color="muted" className="mr-1">
          Table:
        </Typography>
        {TABLE_LAYOUTS.map(({ value, label }) => (
          <Button
            key={value}
            variant={tableLayout === value ? 'surface' : 'ghost-muted'}
            size="xs"
            aria-pressed={tableLayout === value}
            onClick={() => setTableLayout(value)}
          >
            {label}
          </Button>
        ))}
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
  const [tableLayout, setTableLayout] = useState<TableLayout>('by-account')
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
        tableLayout,
        setTableLayout,
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
  const dispatch = useAppDispatch()
  const { viewer, setViewer, view, setCurrentJump, handlers, tableLayout } = usePrototypeFrame()
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
  const backToPaymentsPanel: Partial<PrototypeState> =
    view === 'by-policy'
      ? { screen: 'overview', panelKey: null, policyId: SETUP_ROW_ID, panelScenario: null }
      : { screen: 'overview', panelKey: PAYMENTS_KEY, policyId: null }

  /** Execute: back on the overview with the panel open, Executing until the transaction is "mined", then Active. */
  const execute = () => {
    stopExecution()
    update({ ...backToPaymentsPanel, account: 'executing', dialog: undefined, wizardStep: 0 })
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
      : update(backToPaymentsPanel)

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
    // An account without protection: its first policy is the onboarding, so it starts over on How it works.
    update({
      setupAccountKey: getAccountKey(account),
      setupFromRow: true,
      ...(state.editFromCreate ? { ...EDIT_ENDED, policyId: null, choices: FRESH_CHOICES } : {}),
      wizardStep: state.setupFromRow && !state.editFromCreate ? state.wizardStep : INTRO_STEP,
    })
  }

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

    update({ ...backToPaymentsPanel, account: 'waiting', signedBy, wizardStep: 0 })
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
    coversSpendingLimits: state.choices.applyToSpendingLimits,
  }
  // The account view follows Payments only, so a setup on another account leaves Payments not protected there.
  const paymentsForAccountView: PaymentsSnapshot = isPaymentsSetup
    ? payments
    : { ...payments, state: 'not-set-up', signedCount: 0, pendingChange: false }
  const paymentsPanelState = paymentsForAccountView.state
  const openPanel = (account: M2Account) => update({ panelKey: getAccountKey(account), dialog: undefined })
  const openWizardAt = (wizardStep: number) =>
    update({ screen: 'wizard', panelKey: null, policyId: null, panelScenario: null, addPolicyOpen: false, wizardStep })
  const openPolicy = (row: PolicyRow) =>
    update({ policyId: row.id, protectionKey: null, panelKey: null, panelScenario: null, dialog: undefined })
  const openProtection = (account: M2Account) =>
    update({ protectionKey: getAccountKey(account), policyId: null, panelKey: null, panelScenario: null })
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
      pendingAccountKey: null,
      ...WIZARD_DEFAULTS,
      ...EDIT_ENDED,
      choices: FRESH_CHOICES,
      screen: 'wizard',
      addPolicyOpen: false,
      introOpen: false,
      panelKey: null,
      policyId: null,
      wizardStep: 0,
      account: 'not-set-up',
      signedBy: [],
      pendingChange: false,
    })

  /** "Allowlist" in Add policy: no account yet, so it opens on the account dropdown; the pick decides the path. */
  const startFromNew = () => {
    startAllowlist(null)
    update({ wizardStep: CREATE_STEP })
  }

  return (
    <>
      {view === 'by-account' ? (
        <PoliciesOverviewPage
          key={resetId}
          payments={paymentsForAccountView}
          defaultExpanded={canvasFrame?.expanded ?? [PAYMENTS.address]}
          onSelectAccount={openPanel}
        />
      ) : (
        <PoliciesByPolicyPage
          key={`${resetId}-${tableLayout}`}
          initialGrouping={tableLayout === 'by-account' ? 'account' : null}
          payments={payments}
          initialFilters={canvasFrame?.policyFilters}
          activeRowId={state.policyId ?? undefined}
          onAddPolicy={() => update({ addPolicyOpen: true, policyId: null, pendingAccountKey: null })}
          onSelectAccount={openPanel}
          onSelectPolicy={openPolicy}
          // The onboarding's first step explains protection, so the row goes straight in, without the old intro dialog.
          onProtectAccount={(account) => startAllowlist(getAccountKey(account))}
          onOpenProtection={openProtection}
        />
      )}

      <AddPolicyChooser
        open={state.screen === 'overview' && state.addPolicyOpen}
        onOpenChange={(addPolicyOpen) => update({ addPolicyOpen })}
        // Only the new tile is wired, and it shows the intro first, as M1's tiles do; M1's tiles just close the dialog.
        onSelect={(id) => (id === ALLOWLIST_OPTION_ID ? startFromNew() : update({ addPolicyOpen: false }))}
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
        onClose={() => update({ policyId: null, panelScenario: null, justActivated: false })}
        // Only the new allowlist is driven by the prototype: Confirm reviews it, Execute opens the execute step.
        onConfirm={isSetupRow ? () => openWizardAt(REVIEW_STEP) : undefined}
        onExecute={isSetupRow ? () => openWizardAt(EXECUTE_STEP) : undefined}
        onCancelChange={() => (isSetupRow ? update({ pendingChange: false }) : undefined)}
        onEdit={openAllowlistRow ? () => editAllowlist(openAllowlistRow) : undefined}
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
        onSelectPolicy={openPolicy}
        onClose={() => update({ protectionKey: null })}
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
            account={setupAccount}
            onAccountChange={pickSetupAccount}
            step={state.wizardStep}
            onStepChange={(wizardStep) => update({ wizardStep })}
            choices={state.choices}
            onChoicesChange={(choices) => update({ choices })}
            preflight={state.preflight}
            viewer={viewer}
            onSign={sign}
            onExecute={execute}
            onClose={closeWizard}
            mode={state.wizardMode}
            isAccountLocked={state.wizardMode === 'edit' && !state.editFromCreate}
            accountFromRow={state.setupFromRow && state.wizardMode === 'create'}
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
  name: 'Policies M2 – full flow',
}
