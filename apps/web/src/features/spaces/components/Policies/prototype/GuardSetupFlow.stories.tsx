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
import { Check, ChevronDown, ChevronUp, ShieldCheck } from 'lucide-react'
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
import { PolicyDrawer, type AllowlistPanelScenario } from './m2PolicyDrawers'
import {
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
  CONFIRM_STEP,
  DEFAULT_CHOICES,
  EXECUTE_STEP,
  findM2Account,
  getActiveDetails,
  PERMISSIONS_STEP,
  REVIEW_STEP,
  SETUP_PREVIEW_HANDLERS,
  SetUpPoliciesFlow,
  WIZARD_STORE,
  type Preflight,
  type SetupChoices,
  type WizardMode,
} from './m2SetupFlow'

// AddPolicyDialog only takes its own policy ids, so the new tile borrows `recovery`, which M1 doesn't offer yet.
const ALLOWLIST_OPTION: AddPolicyOption = {
  id: 'recovery',
  title: 'Recipient allowlist',
  description: 'Only addresses on your list can receive funds. Everything else is blocked.',
  Icon: ShieldCheck,
}

const ADD_POLICY_OPTIONS_WITH_ALLOWLIST = [ALLOWLIST_OPTION, ...ADD_POLICY_OPTIONS]

/** M1's AddPolicyDialog markup, kept in one column: M1's goes two-column past three options. */
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
    <DialogContent size="xs" data-testid="add-policy-dialog">
      <DialogHeader>
        <DialogTitle className="text-xl leading-6 font-semibold">Add policy</DialogTitle>
      </DialogHeader>

      {/* auto-rows-fr: every tile takes the tallest one's height, so a description that wraps doesn't make one bigger. */}
      <div className="grid auto-rows-fr gap-3 px-4 pb-4" data-m2-new="M1 copy · Add policy dialog (one column)">
        {ADD_POLICY_OPTIONS_WITH_ALLOWLIST.map((option) => (
          <AddPolicyOptionButton key={option.id} {...option} onClick={() => onSelect(option.id)} />
        ))}
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
  /** A Recipient allowlist side panel state picked in Jump to; null follows the prototype's own state. */
  panelScenario: AllowlistPanelScenario | null
  /** The Ops bot's spending limit next to the Payments allowlist; set by the All states canvas only. */
  spendingLimitState: SpendingLimitState
  addPolicyOpen: boolean
  /** The recipient allowlist's intro dialog, between Add policy and the create flow. */
  introOpen: boolean
  /** The account the new recipient allowlist is for (getAccountKey); null until picked on Create. */
  setupAccountKey: string | null
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
  account: 'not-set-up',
  signedBy: [],
  pendingChange: false,
  wizardStep: 0,
  wizardMode: 'create',
  editInitialChoices: null,
  editRestore: null,
  ...WIZARD_DEFAULTS,
}

/** Leaves edit mode, so the next way into the wizard creates again. */
const EDIT_ENDED: Partial<PrototypeState> = {
  wizardMode: 'create',
  editInitialChoices: null,
  editRestore: null,
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
  panelKey: null,
  wizardMode: 'create',
  editInitialChoices: null,
  editRestore: null,
  ...NOT_STARTED,
  ...ON_PAYMENTS,
}

// Payments' spending limits send USDC (Ops bot) and ETH (Payroll bot): unchecking those tokens puts them in conflict.
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
    heading: 'Create recipient allowlist',
    jumps: [
      { label: 'Create', state: { ...WIZARD, wizardStep: 0 } },
      { label: 'Policies', state: { ...WIZARD, wizardStep: PERMISSIONS_STEP } },
      { label: 'Review', state: { ...WIZARD, wizardStep: REVIEW_STEP } },
      { label: 'Confirm', state: { ...WIZARD, wizardStep: CONFIRM_STEP } },
      { label: 'Execute', state: { ...WIZARD, wizardStep: EXECUTE_STEP, account: 'ready', ...FULLY_SIGNED } },
    ],
  },
  {
    // The same states as M1's SpendingLimitDrawer stories, on the new allowlist (Payments).
    heading: 'Recipient allowlist side panel',
    jumps: [
      allowlistPanel('Active · signer', LIVE_SETUP, { viewer: 'signer' }),
      allowlistPanel('Active · no wallet', LIVE_SETUP, { viewer: 'disconnected' }),
      allowlistPanel('Active · not a signer', LIVE_SETUP, { viewer: 'non-signer' }),
      allowlistPanel('Pending · already signed', PENDING_SETUP, { viewer: 'signer-signed' }),
      allowlistPanel('Pending · not signed', PENDING_SETUP, { viewer: 'signer' }, 'tom'),
      allowlistPanel('Pending · no wallet', PENDING_SETUP, { viewer: 'disconnected' }),
      allowlistPanel('Pending · not a signer', PENDING_SETUP, { viewer: 'non-signer' }),
      allowlistPanel('Pending · fully signed', SIGNED_SETUP, { viewer: 'non-signer' }),
      allowlistPanel('Pending · removal', PENDING_SETUP, { viewer: 'signer', operation: 'remove' }, 'tom'),
      allowlistPanel('Executed', PENDING_SETUP, { viewer: 'signer', outcome: 'executed' }),
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
        label: 'Filtered: Recipient allowlist',
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
        label: 'Recipient allowlist · Active',
        jump: {
          view: BY_POLICY,
          state: { ...POLICY_TABLE, policyId: SETUP_ROW_ID, account: 'enforcing', ...FULLY_SIGNED },
        },
      },
      {
        id: 'drawer-allowlist-pending',
        label: 'Recipient allowlist · Pending',
        jump: { view: BY_POLICY, state: { ...PENDING_TABLE, policyId: SETUP_ROW_ID } },
      },
      {
        id: 'drawer-allowlist-change-pending',
        label: 'Recipient allowlist · Change pending',
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
        label: 'Spending limit · Blocked by allowlist (Payments)',
        jump: { view: BY_POLICY, state: SPENDING_LIMIT_BLOCKED },
      },
      {
        id: 'drawer-spending-limit-locked',
        label: 'Spending limit · Locked by allowlist (Payments)',
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
        jump: { state: { ...WIZARD, wizardStep: 0, setupAccountKey: null } },
      },
      { id: 'create-payments', label: 'Payments', jump: { state: { ...WIZARD, wizardStep: 0 } } },
      {
        id: 'create-treasury',
        label: 'Treasury',
        jump: { state: { ...WIZARD, wizardStep: 0, setupAccountKey: getAccountKey(TREASURY) } },
      },
      {
        id: 'create-vault-3',
        label: 'Vault 3',
        jump: { state: { ...WIZARD, wizardStep: 0, setupAccountKey: getAccountKey(VAULT_3) } },
      },
      {
        id: 'create-old-version',
        label: 'Failure · Old version',
        jump: { state: { ...WIZARD, wizardStep: 0, preflight: 'old-version' } },
      },
      {
        id: 'create-other-guard',
        label: 'Failure · Another guard',
        jump: { state: { ...WIZARD, wizardStep: 0, preflight: 'other-guard' } },
      },
      {
        id: 'create-pending-transactions',
        label: 'Failure · Pending transactions',
        jump: { state: { ...WIZARD, wizardStep: 0, preflight: 'pending-transactions' } },
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
        jump: { view: BY_POLICY, state: { ...EDIT, wizardStep: 0 } },
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

/** The story shell mocks TxModalContext with no flow, so the app can't hide its sidebar; this layer covers it instead. */
const FullScreenFlow = ({ children }: { children: ReactNode }): ReactElement | null => {
  const isDarkMode = useDarkMode()
  const wallet = useWallet()
  const walletName = useWalletName(wallet)
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

        {children}
      </div>
    </ShadcnProvider>,
    document.body,
  )
}

/** The M2 screens wired together with local state only: nothing is signed or sent. */
const GuardSetupFlowPrototype = (): ReactElement => {
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
      update({ account: 'enforcing' })
      toast('Successfully executed.')
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
  const signEdit = () => {
    toast('Successfully added to queue.')
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
      ? update({ screen: 'overview', panelKey: null, ...EDIT_ENDED, ...(state.editRestore ?? {}) })
      : update(backToPaymentsPanel)

  /** Edit in a live allowlist's panel: the create flow on that account, starting from the allowlist as it is. */
  const editAllowlist = (row: PolicyRow) => {
    const initialChoices: SetupChoices =
      row.id === SETUP_ROW_ID
        ? state.choices
        : {
            recipients: row.people.map(({ name, address }) => ({ name, address, selected: true })),
            addedTokens: [],
            keptConflicts: [],
            ...getAllowlistSettings(row.account),
          }

    update({
      screen: 'wizard',
      wizardMode: 'edit',
      wizardStep: 0,
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

    toast(isNewSetup ? 'Successfully added to queue.' : 'Successfully signed.')

    if (signedBy.length >= setupTarget.threshold) {
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
    update({ policyId: row.id, panelKey: null, panelScenario: null, dialog: undefined })
  const openRow = getPolicyRows(payments).find(({ id }) => id === state.policyId)
  const isSetupRow = openRow?.id === SETUP_ROW_ID
  // Only the allowlist panel's Edit is wired; M1's spending limit and proposer panels keep theirs unset.
  const openAllowlistRow = openRow?.type === 'allowlist' ? openRow : undefined

  /** "Recipient allowlist" in Add policy: a fresh setup, starting with the account dropdown. */
  const startAllowlist = () =>
    update({
      ...WIZARD_DEFAULTS,
      screen: 'wizard',
      addPolicyOpen: false,
      introOpen: false,
      panelKey: null,
      policyId: null,
      wizardStep: 0,
      setupAccountKey: null,
      account: 'not-set-up',
      signedBy: [],
      pendingChange: false,
    })

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
          key={resetId}
          payments={payments}
          initialFilters={canvasFrame?.policyFilters}
          onAddPolicy={() => update({ addPolicyOpen: true, policyId: null })}
          onSelectAccount={openPanel}
          onSelectPolicy={openPolicy}
        />
      )}

      <AddPolicyChooser
        open={state.screen === 'overview' && state.addPolicyOpen}
        onOpenChange={(addPolicyOpen) => update({ addPolicyOpen })}
        // Only the new tile is wired, and it shows the intro first, as M1's tiles do; M1's tiles just close the dialog.
        onSelect={(id) => update({ addPolicyOpen: false, introOpen: id === ALLOWLIST_OPTION.id })}
      />

      <AllowlistIntroDialog
        open={state.screen === 'overview' && state.introOpen}
        onOpenChange={(open) => (open ? undefined : update({ introOpen: false }))}
        onProceed={startAllowlist}
      />

      <PolicyDrawer
        open={state.screen === 'overview' && Boolean(openRow)}
        row={openRow}
        viewerHasSigned={isSetupRow && state.signedBy.includes(viewer)}
        scenario={isSetupRow ? (state.panelScenario ?? undefined) : undefined}
        spendingLimitBlockedTokens={BLOCKED_SPENDING_LIMIT_TOKENS}
        paymentsExcludedTokens={state.choices.excludedTokens}
        onClose={() => update({ policyId: null, panelScenario: null })}
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
            onAccountChange={(account) => update({ setupAccountKey: getAccountKey(account) })}
            disabledAccountKeys={getAllowlistAccountKeys(payments)}
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
            initialChoices={state.editInitialChoices ?? undefined}
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
