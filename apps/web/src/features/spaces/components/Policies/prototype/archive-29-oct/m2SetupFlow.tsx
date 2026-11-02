import {
  createContext,
  Fragment,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ContextType,
  type FormEvent,
  type ReactElement,
  type ReactNode,
  type Ref,
  type RefObject,
} from 'react'
import { concat, dataLength, getAddress, Interface, isAddress, solidityPacked } from 'ethers'
import ChainIndicator from '@/components/common/ChainIndicator'
import { http, HttpResponse } from 'msw'
import { EthSafeTransaction } from '@safe-global/protocol-kit'
import type {
  AddressInfo,
  DataDecodedParameter,
  MultiSend,
  TransactionPreview,
} from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { OperationType, type SafeTransaction } from '@safe-global/types-kit'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { HelpCenterArticle } from '@safe-global/utils/config/constants'
import ObservabilityErrorBoundary from '@/components/common/ObservabilityErrorBoundary'
import { BalanceChanges, FeesPreview, TxNote } from '@/components/tx-flow/features'
import { SafeTxContext, type SafeTxContextParams } from '@safe-global/views/components/tx-flow/SafeTxContext'
import { SlotProvider } from '@/components/tx-flow/slots'
import TxFlowProvider, { TxFlowContext } from '@/components/tx-flow/TxFlowProvider'
import { Badge } from '@safe-global/views/components/ui/badge'
import { RadioGroup, RadioGroupItem } from '@safe-global/views/components/ui/radio-group'
import { Separator } from '@safe-global/views/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@safe-global/views/components/ui/tabs'
import { ReviewTransactionContent } from '@/components/tx/ReviewTransactionV2/ReviewTransactionContent'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@safe-global/views/components/ui/accordion'
import { HexEncodedData } from '@/components/transactions/HexEncodedData'
import { generateDataRowValue, TxDataRow } from '@/components/transactions/TxDetails/Summary/TxDataRow'
import DecodedData from '@/components/transactions/TxDetails/TxData/DecodedData'
import MethodCall from '@/components/transactions/TxDetails/TxData/DecodedData/MethodCall'
import { MultisendActionsHeader } from '@/components/transactions/TxDetails/TxData/DecodedData/Multisend'
import singleTxCss from '@/components/transactions/TxDetails/TxData/DecodedData/SingleTxDecoded/styles.module.css'
import {
  Building2,
  Check,
  ChevronDown,
  Clock,
  Code,
  HardDrive,
  Info,
  Search,
  Settings2,
  Plus,
  Users,
  UsersRound,
  ListPlus,
  X,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import {
  Combobox,
  ComboboxCollection,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxLabel,
  ComboboxList,
  useComboboxAnchor,
} from '@safe-global/views/components/ui/combobox'
import { InputGroupAddon } from '@safe-global/views/components/ui/input-group'
import { BelowComboboxContent } from '../m2SpendingLimitForm'
import { FormProvider, useForm } from 'react-hook-form'
import AddressInput from '@/components/common/AddressInput'
import { Popover, PopoverContent, PopoverTrigger } from '@safe-global/views/components/ui/popover'
import { SearchInput } from '@safe-global/views/components/ui/search-input'
import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'
import ExternalLink from '@safe-global/views/components/common/ExternalLink'
import Identicon from '@/components/common/Identicon'
import TokenIcon from '@/components/common/TokenIcon'
import TxModalDialog from '@safe-global/views/components/common/TxModalDialog'
import txDialogCss from '@safe-global/views/components/common/TxModalDialog/styles.module.css'
import { Dialog as DialogPrimitive } from '@base-ui/react/dialog'
import { usePortalContainer } from '@safe-global/views/components/ui/ShadcnProvider'
import TxCard, { TxCardActions } from '@safe-global/views/components/tx-flow/common/TxCard'
import classnames from 'classnames'
import TxLayout from '@/components/tx-flow/common/TxLayout'
import { TxLayoutHeader } from '@/components/tx-flow/common/TxLayoutBase'
import layoutCss from '@/components/tx-flow/common/TxLayoutBase/styles.module.css'
import { TxInfoContext, TxInfoProvider } from '@/components/tx-flow/TxInfoProvider'
import { useChain } from '@/hooks/useChains'
import { SafeShieldProvider, useSafeShield } from '@/features/safe-shield/SafeShieldContext'
// eslint-disable-next-line no-restricted-imports -- story-only prototype: the barrel's SafeShieldWidget hooks never settle in Storybook, so the display is fed mock analysis
import { SafeShieldDisplay } from '@/features/safe-shield/components/SafeShieldDisplay'
import {
  ContractStatus,
  Severity,
  StatusGroup,
  ThreatStatus,
  type ContractAnalysisResults,
  type ThreatAnalysisResults,
} from '@safe-global/utils/features/safe-shield/types'
import type { AsyncResult } from '@safe-global/utils/hooks/useAsync'
import { FETCH_STATUS } from '@safe-global/utils/components/tx/security/tenderly/types'
import { getSimulationLink, type SimulationStatus } from '@safe-global/utils/components/tx/security/tenderly/utils'
import TxSectionTitle from '@safe-global/views/components/tx-flow/common/TxSectionTitle'
import { Button } from '@safe-global/views/components/ui/button'
import { Card, CardContent } from '@safe-global/views/components/ui/card'
import { Checkbox } from '@safe-global/views/components/ui/checkbox'
import { Field, FieldLabel } from '@safe-global/views/components/ui/field'
import { Input } from '@safe-global/views/components/ui/input'
import { Toggle } from '@safe-global/views/components/ui/toggle'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@safe-global/views/components/ui/collapsible'
import AddressBookIcon from '@/public/images/sidebar/address-book.svg'
import { Typography } from '@safe-global/views/components/ui/typography'
import { AccountSelect } from '../m2AccountSelect'
import { M2Alert } from '../m2Alert'
import {
  INELIGIBILITY_TEXT,
  NESTED_SAFES_NOTICE_TITLE,
} from '@safe-global/views/features/spaces/components/Policies/SafeAccountSelector/constants'
import { CHANGE_BADGE } from '@safe-global/views/features/spaces/components/Policies/SpendingLimitFlow/Summary/constants'
import { POLICY_ICONS } from '@safe-global/views/features/spaces/components/Policies/utils/policyIcon'
import type {
  SafeAccountEntry,
  SafeAccountIneligibility,
  SafeAccountOption,
} from '@safe-global/views/features/spaces/components/Policies/SafeAccountSelector/types'
import { AccountBalance, toStatChains } from '../../SafeAccountSelector/components/SafeAccountRow'
import SafeRowStats from '../../../SafeSelectorDropdown/components/SafeRowStats'
import type { ActiveDetails } from '../m2AccountPanel'
import {
  ADDRESS_BOOK,
  AddressHoverTooltip,
  findAddressBookContact,
  ShortAddress,
  getAccountKey,
  getAccountSpendingLimits,
  OPERATIONS,
  otherSignerNames,
  PAYMENTS,
  PAYMENTS_ARBITRUM,
  SafeAddress,
  SPACE_NAME,
  toSpaceContact,
  TRADING_DESK,
  TREASURY,
  TREASURY_BASE,
  VAULT_3,
  type M2Account,
  type SignerId,
  AccountProtectionIcon,
} from '../m2Prototype'

/**
 * One per stepper item, in the order of the first-time setup (the onboarding): how it works, account settings,
 * the first policy, then the spending limits it covers. Spending limits is skipped for an account that has none.
 */
export const WIZARD_STEP_NAMES = [
  'How it works',
  'Settings',
  'Everything else',
  'Policies',
  'Allowlist',
  'Review',
  'Confirm',
  'Execute',
] as const

export const INTRO_STEP = WIZARD_STEP_NAMES.indexOf('How it works')
export const BASELINE_STEP = WIZARD_STEP_NAMES.indexOf('Everything else')
export const SETTINGS_STEP = WIZARD_STEP_NAMES.indexOf('Settings')
export const POLICIES_STEP = WIZARD_STEP_NAMES.indexOf('Policies')
export const CREATE_STEP = WIZARD_STEP_NAMES.indexOf('Allowlist')
export const REVIEW_STEP = WIZARD_STEP_NAMES.indexOf('Review')
export const CONFIRM_STEP = WIZARD_STEP_NAMES.indexOf('Confirm')
export const EXECUTE_STEP = WIZARD_STEP_NAMES.indexOf('Execute')

/** Page titles per screen, in WIZARD_STEP_NAMES order; the receipts keep ConfirmTxReceipt's "Review details". */
const STEP_TITLES = [
  'Set up policies',
  'Safe account settings',
  'What happens to everything else',
  'Your policies',
  'Add your first policy',
  'Confirm policy enforcement',
  'Review details',
  'Review details',
] as const

/** Create sets up a new allowlist; edit changes a live one, on its own account, as M1's EditSpendingLimitFlow does. */
export type WizardMode = 'create' | 'edit'

/** The edit swaps only the allowlist's title; the rest are the setup's. */
const getStepTitle = (mode: WizardMode, step: number): string =>
  mode === 'edit' && step === CREATE_STEP
    ? 'Edit allowlist'
    : mode === 'edit' && step === REVIEW_STEP
      ? 'Confirm allowlist'
      : STEP_TITLES[step]

/** The pre-setup checks on the account: all pass, or the one that blocks setup. */
export type Preflight = 'ready' | 'old-version' | 'other-guard'

const PREFLIGHT_FAILURES: Record<
  Exclude<Preflight, 'ready'>,
  { title: string; description: string; action?: string; href?: string; tone?: 'error' | 'warning' }
> = {
  'old-version': {
    title: 'This Safe account needs an update',
    description: 'Policies need Safe version 1.3.0 or later.',
    action: 'Update Safe account',
  },
  'other-guard': {
    title: 'This Safe account has an unknown policy installed',
    description: 'Remove it to enforce policies.',
    action: 'How to remove it',
    href: HelpCenterArticle.TRANSACTION_GUARD,
  },
}

/** `wallet: 'owner'` resolves to the efSafe fixture's first owner, so it stays a signer of the 2-of-3 below. */
const PAYMENTS_OWNERS = [
  '0x5eD8Cee6b63b1c6AFce3AD7c92f4fD7E1B8fAd9F',
  '0x1De7F5cc55653C581d1c842AD155f88cE389E0B2',
  '0x24BBC568dC89E4e57bAF23b759989F3D6113BBaA',
]

/** Store override so the modal's status rail reads 2 of 3 for Payments. */
export const WIZARD_STORE = {
  safeInfo: {
    data: {
      threshold: PAYMENTS.threshold,
      version: PAYMENTS.version,
      owners: PAYMENTS_OWNERS.map((value) => ({ value, name: null, logoUri: null })),
      nonce: 12,
    },
  },
}

const chainInfo = (chainId: string, chainName: string, shortName: string) => ({
  chainId,
  chainName,
  shortName,
  chainLogoUri: `https://safe-transaction-assets.safe.global/chains/${chainId}/chain_logo.png`,
})

const CHAIN_INFO: Record<string, ReturnType<typeof chainInfo>> = {
  '1': chainInfo('1', 'Ethereum', 'eth'),
  '42161': chainInfo('42161', 'Arbitrum', 'arb1'),
  '8453': chainInfo('8453', 'Base', 'base'),
}

const FIAT_TOTALS: Record<string, string> = {
  [getAccountKey(PAYMENTS)]: '48210.55',
  [getAccountKey(PAYMENTS_ARBITRUM)]: '6120.00',
  [getAccountKey(TREASURY)]: '1250400.00',
  [getAccountKey(TREASURY_BASE)]: '84300.00',
  [getAccountKey(TRADING_DESK)]: '312780.40',
  [getAccountKey(VAULT_3)]: '9050.00',
  [getAccountKey(OPERATIONS)]: '29800.00',
}

// Prototype only: M1's selector has a fixed set of reasons, so this one is registered on its text map at runtime.
const HAS_ALLOWLIST = 'has-allowlist' as string as SafeAccountIneligibility
INELIGIBILITY_TEXT[HAS_ALLOWLIST] = 'Already enforced'

/** An M2 account as M1's Safe account row takes it, so "Applies to" and the dropdown are M1's own rows. */
const toSafeAccountOption = (account: M2Account, ineligibleReason?: SafeAccountIneligibility): SafeAccountOption => ({
  id: getAccountKey(account),
  chainId: account.chainId,
  address: account.address,
  name: account.name,
  threshold: account.threshold,
  owners: account.owners,
  eligibility: 'signer',
  chain: CHAIN_INFO[account.chainId],
  fiatTotal: FIAT_TOTALS[getAccountKey(account)],
  ineligibleReason,
})

/** The space's Safes, one group per Safe; a Safe on two networks is a group, as in M1's dropdown. */
const ACCOUNT_GROUPS: M2Account[][] = [
  [PAYMENTS, PAYMENTS_ARBITRUM],
  [TREASURY, TREASURY_BASE],
  [TRADING_DESK],
  [VAULT_3],
  [OPERATIONS],
]

export const findM2Account = (key: string): M2Account | undefined =>
  ACCOUNT_GROUPS.flat().find((account) => getAccountKey(account) === key)

/** M1's dropdown entries; accounts that already have an allowlist are disabled with that reason. */
/** Every account the setup's picker lists, keyed like getAccountKey. */
export const PICKER_ACCOUNT_KEYS: string[] = ACCOUNT_GROUPS.flat().map(getAccountKey)

const getAccountEntries = (disabledKeys: string[], reason: SafeAccountIneligibility): SafeAccountEntry[] =>
  ACCOUNT_GROUPS.map((accounts) => {
    const options = accounts.map((account) =>
      toSafeAccountOption(account, disabledKeys.includes(getAccountKey(account)) ? reason : undefined),
    )
    if (options.length === 1) return options[0]

    const [first] = accounts
    const isShared = accounts.every(({ threshold, owners }) => threshold === first.threshold && owners === first.owners)

    return {
      address: first.address,
      name: first.name,
      accounts: options,
      fiatTotal: String(options.reduce((sum, { fiatTotal }) => sum + Number(fiatTotal ?? 0), 0)),
      threshold: isShared ? first.threshold : undefined,
      owners: isShared ? first.owners : undefined,
    }
  })

const NESTED_SAFES_NOTICE = {
  title: NESTED_SAFES_NOTICE_TITLE,
  description: 'To manage policy enforcement for nested Safe accounts, go to the Safe account settings.',
}

const GUARD_ADDRESS = '0x1a4f7b8c9d0e1f2a3b4c5d6e7f8091a2b3c4c802'

export type Recipient = {
  name: string
  address: string
  /** Absent for an address added by hand or from the address book. */
  history?: { count: number; last: string }
  /** Set when it was picked from the address book rather than typed in. */
  source?: 'address-book'
  selected: boolean
}

type Contact = { name: string; address: string }

export const PREFILLED_RECIPIENTS: Recipient[] = [
  {
    name: 'Payroll — Deel',
    address: '0x4bc91d2e3f4a5b6c7d8e9f0a1b2c3d4e5f60a88b',
    history: { count: 26, last: '3 days ago' },
    selected: true,
  },
  {
    name: 'Contractor — M. Ito',
    address: '0x7a219e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b4412',
    history: { count: 9, last: '12 days ago' },
    selected: true,
  },
  {
    name: 'Ops wallet',
    address: '0x1f8e2a3b4c5d6e7f8091a2b3c4d5e6f708195517',
    history: { count: 7, last: 'yesterday' },
    selected: true,
  },
  {
    name: 'Coinbase Prime',
    address: '0x9cd45e6f708192a3b4c5d6e7f8091a2b3c4d9013',
    history: { count: 2, last: '41 days ago' },
    selected: true,
  },
]

/** The height every row on the Create form shares: the account field and each token and recipient item. */
export const FORM_ROW_HEIGHT = 'min-h-16'

/** The choices made in the wizard; the second signer reviews the same ones. */
export type SetupChoices = {
  recipients: Recipient[]
  /** Symbols of the account's tokens left unchecked; every token is allowed until one is unchecked. */
  excludedTokens: string[]
  /** Symbols added with "Add a token", on top of the account's own. */
  addedTokens: string[]
  /** Spenders whose spending-limit conflict was answered with "Keep as is". */
  keptConflicts: string[]
  /** Ids of Safe account settings left unselected: changes to them will be blocked. */
  blockedSettings: string[]
  /** Policy enforcement on its own: what happens to transactions no policy covers. Blocked by default. */
  baseline?: Baseline
  /** Policy enforcement on its own, on an account with no policies: add an allowlist in the same setup. */
  addAllowlist?: boolean
}

/** What happens to a transaction no policy covers, chosen when policy enforcement is set up on its own. */
export type Baseline = 'block-all' | 'allow-all'

export const DEFAULT_CHOICES: SetupChoices = {
  recipients: PREFILLED_RECIPIENTS,
  // USDC starts unchecked so the prototype opens with Ops bot's spending limit flagged under Existing permissions.
  excludedTokens: ['USDC'],
  addedTokens: [],
  keptConflicts: [],
  blockedSettings: [],
}

/** "A", "A and B", "A, B and C". */
const joinList = (items: string[]): string =>
  items.length <= 1 ? (items[0] ?? '') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`

/** What an executed setup turned on, for the Active side panel. */
export const getActiveDetails = (choices: SetupChoices): ActiveDetails => ({
  recipientCount: choices.recipients.filter(({ selected }) => selected).length,
})

/** Before an account is picked, only recipients added by hand: the suggestions come from its payment history. */
const getShownRecipients = (choices: SetupChoices, account?: M2Account): Recipient[] =>
  account ? choices.recipients : choices.recipients.filter(({ history }) => !history)

/** A token the form can list; `balance` is absent for one added by hand that the account doesn't hold. */
type AccountToken = { symbol: string; name: string; logoUri: string; balance?: string; address?: string }

const tokenLogo = (address: string) => `https://safe-transaction-assets.safe.global/tokens/logos/${address}.png`
const ETH_LOGO = 'https://safe-transaction-assets.safe.global/chains/1/currency_logo.png'

const token =
  (symbol: string, name: string, logoUri: string) =>
  (balance: string): AccountToken => ({
    symbol,
    name,
    logoUri,
    balance: `${balance} ${symbol}`,
  })

const USDC = token('USDC', 'USD Coin', tokenLogo('0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'))
// The Safe CDN's USDT logo has a wide transparent margin and reads smaller than the others at the same size.
const USDT_LOGO = 'https://assets.coingecko.com/coins/images/325/large/Tether.png'
const USDT = token('USDT', 'Tether USD', USDT_LOGO)
const DAI = token('DAI', 'Dai Stablecoin', tokenLogo('0x6B175474E89094C44Da98b954EedeAC495271d0F'))
const WBTC = token('WBTC', 'Wrapped BTC', tokenLogo('0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599'))
const ETH = token('ETH', 'Ether', ETH_LOGO)

/** Each account's tokens, as its balances would list them. */
const ACCOUNT_TOKENS: Record<string, AccountToken[]> = {
  [getAccountKey(PAYMENTS)]: [USDC('42,310.55'), USDT('4,200'), ETH('0.62')],
  [getAccountKey(PAYMENTS_ARBITRUM)]: [USDC('5,800'), ETH('0.12')],
  [getAccountKey(TREASURY)]: [USDC('820,000'), DAI('210,400'), WBTC('2.4'), ETH('31.5')],
  [getAccountKey(TREASURY_BASE)]: [USDC('72,000'), ETH('4.1')],
  [getAccountKey(TRADING_DESK)]: [USDC('240,000'), ETH('22.8')],
  [getAccountKey(VAULT_3)]: [USDC('8,400'), ETH('0.2')],
  [getAccountKey(OPERATIONS)]: [USDC('22,000'), USDT('5,000'), ETH('0.9')],
}

export const getAccountTokens = (account?: M2Account): AccountToken[] =>
  account ? (ACCOUNT_TOKENS[getAccountKey(account)] ?? []) : []

/** What "Add a token" offers, as M1's token selector lists popular tokens next to the Safe's own. */
const popularToken = (symbol: string, name: string, address: string, logoUri = tokenLogo(address)): AccountToken => ({
  symbol,
  name,
  address,
  logoUri,
})

export const POPULAR_TOKENS: AccountToken[] = [
  popularToken('USDC', 'USD Coin', '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'),
  popularToken('USDT', 'Tether USD', '0xdAC17F958D2ee523a2206206994597C13D831ec7', USDT_LOGO),
  popularToken('DAI', 'Dai Stablecoin', '0x6B175474E89094C44Da98b954EedeAC495271d0F'),
  popularToken('WETH', 'Wrapped Ether', '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'),
  popularToken('WBTC', 'Wrapped BTC', '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599'),
  popularToken('LINK', 'Chainlink', '0x514910771AF9Ca656af840dff83E8264EcF986CA'),
  popularToken('UNI', 'Uniswap', '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984'),
  popularToken('AAVE', 'Aave', '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9'),
  popularToken('MKR', 'Maker', '0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2'),
  popularToken('LDO', 'Lido DAO', '0x5A98FcBEA516Cf06857215779Fd812CA3beF1B32'),
  popularToken('stETH', 'Lido Staked Ether', '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84'),
  popularToken('rETH', 'Rocket Pool ETH', '0xae78736Cd615f374D3085123A210448E74Fc6393'),
  popularToken('COMP', 'Compound', '0xc00e94Cb662C3520282E6f5717214004A7f26888'),
  popularToken('CRV', 'Curve DAO', '0xD533a949740bb3306d119CC777fa900bA034cd52'),
  popularToken('SNX', 'Synthetix', '0xC011a73ee8576Fb46F5E1c5751cA3B9Fe0af2a6F'),
  popularToken('ENS', 'Ethereum Name Service', '0xC18360217D8F7Ab5e7c516566761Ea12Ce7F9D72'),
  popularToken('GRT', 'The Graph', '0xc944E90C64B2c07662A292be6244BDf05Cda44a7'),
  popularToken('SAFE', 'Safe', '0x5aFE3855358E112B5647B952709E6165e1c1eEEe'),
]

/** The form's token list: the account's own, then any added by hand. Empty until an account is picked. */
const getFormTokens = (choices: SetupChoices, account?: M2Account): AccountToken[] => {
  const held = getAccountTokens(account)
  if (!account) return held

  const added = POPULAR_TOKENS.filter(
    ({ symbol }) => choices.addedTokens.includes(symbol) && !held.some((token) => token.symbol === symbol),
  )
  return [...held, ...added]
}

/** The tokens left checked for the picked account. */
const getAllowedTokens = (choices: SetupChoices, account?: M2Account): AccountToken[] =>
  getFormTokens(choices, account).filter(({ symbol }) => !choices.excludedTokens.includes(symbol))

const getSelectedRecipients = (choices: SetupChoices): Recipient[] =>
  choices.recipients.filter(({ selected }) => selected)

const recipientKey = ({ address }: Recipient): string => address.toLowerCase()
const tokenKey = ({ symbol }: AccountToken): string => symbol

const isSameSet = (a: string[], b: string[]): boolean => a.length === b.length && a.every((item) => b.includes(item))

/** M1's isUnchangedEdit: the edit allows the same recipients and tokens as the live allowlist, so nothing to sign. */
const isUnchangedChoices = (choices: SetupChoices, initial: SetupChoices, account?: M2Account): boolean =>
  isSameSet(getSelectedRecipients(choices).map(recipientKey), getSelectedRecipients(initial).map(recipientKey)) &&
  isSameSet(getAllowedTokens(choices, account).map(tokenKey), getAllowedTokens(initial, account).map(tokenKey)) &&
  isSameSet(choices.blockedSettings, initial.blockedSettings)

/** The CHANGE_BADGE verdicts an allowlist edit can give a recipient or a token. */
type ListChange = 'added' | 'removed'
type Marked<T> = T & { change?: ListChange }

/** The list after the edit, new items marked added, then the items it drops, marked removed. */
const markChanges = <T extends object>(current: T[], initial: T[], keyOf: (item: T) => string): Marked<T>[] => {
  const initialKeys = initial.map(keyOf)
  const currentKeys = current.map(keyOf)

  return [
    ...current.map((item) => ({ ...item, change: initialKeys.includes(keyOf(item)) ? undefined : ('added' as const) })),
    ...initial
      .filter((item) => !currentKeys.includes(keyOf(item)))
      .map((item) => ({ ...item, change: 'removed' as const })),
  ]
}

const MutedLine = ({ children }: { children: ReactNode }): ReactElement => (
  <Typography variant="paragraph-small" color="muted">
    {children}
  </Typography>
)

/** A Create section: one light grey surface with its items white inside it. */
const GroupSurface = ({
  title,
  description,
  action,
  sectionRef,
  markNew,
  children,
}: {
  title: string
  description?: string
  /** Top right of the section, e.g. Select all. */
  action?: ReactNode
  /** For scrolling the section into view, e.g. "Change tokens". */
  sectionRef?: Ref<HTMLElement>
  markNew: string
  children?: ReactNode
}): ReactElement => (
  <section ref={sectionRef} className="flex scroll-mt-72 flex-col gap-4 rounded-xl bg-muted p-4" data-m2-new={markNew}>
    <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 flex-col gap-1">
        <TxSectionTitle>{title}</TxSectionTitle>
        {description && <MutedLine>{description}</MutedLine>}
      </div>
      {action}
    </div>
    {children}
  </section>
)

/** The account field's height, so every row on the form matches whatever its content. */
const ItemSurface = ({
  children,
  className,
  markNew,
}: {
  children: ReactNode
  className?: string
  markNew?: string
}): ReactElement => (
  <div
    className={classnames('flex flex-col justify-center gap-3 rounded-lg bg-card p-3', FORM_ROW_HEIGHT, className)}
    data-m2-new={markNew}
  >
    {children}
  </div>
)

/** AddressInput laid flat in the row: no box, identicon or label (the label comes back only to carry an error). */
const INLINE_ADDRESS_INPUT = [
  '[&_[data-slot=field]]:w-full [&_[data-slot=field]]:gap-0.5',
  '[&_[data-slot=field-label]]:sr-only [&:has([aria-invalid=true])_[data-slot=field-label]]:not-sr-only',
  '[&_[data-slot=field]>div]:min-h-0 [&_[data-slot=field]>div]:gap-2 [&_[data-slot=field]>div]:border-0',
  '[&_[data-slot=field]>div]:bg-transparent [&_[data-slot=field]>div]:p-0 [&_[data-slot=field]>div]:shadow-none',
  '[&_[data-slot=field]>div>div:first-child]:hidden',
  '[&_input]:font-mono [&_input]:text-xs [&_input]:text-muted-foreground',
].join(' ')

/** Items in a section sit 8px apart. */
const ItemList = ({ children }: { children: ReactNode }): ReactElement => (
  <div className="flex flex-col gap-2">{children}</div>
)

/** Labels sit in a 40px box, one name-over-address line, so each lines up with the first item beside it. */
const SummaryRow = ({ label, children }: { label: string; children: ReactNode }): ReactElement => (
  <div className="@container w-full">
    <div className="grid grid-cols-1 items-start gap-1 @md:grid-cols-[176px_1fr] @md:gap-6">
      <Typography variant="paragraph-small" className="flex min-h-10 items-center">
        {label}
      </Typography>
      <div className="flex min-w-0 flex-col gap-3">{children}</div>
    </div>
  </div>
)

/** A value item at the shared 40px line height, so single-line and two-line values centre on the same axis. */
const SummaryLine = ({ children, className }: { children: ReactNode; className?: string }): ReactElement => (
  <div className={classnames('flex min-h-10 items-center', className)}>{children}</div>
)

/** M1's change badge (CHANGE_BADGE), at the side panel's fixed width so a column of them lines up. */
const ChangeBadge = ({ change }: { change: ListChange }): ReactElement => (
  <Badge variant={CHANGE_BADGE[change].variant} className="w-20 shrink-0 justify-center">
    {CHANGE_BADGE[change].label}
  </Badge>
)

/** Account, tokens and recipients as one card, since they are one policy; identity as SafeAddress for 24px identicons. */
const PolicyDetailsCard = ({
  safe,
  tokens,
  recipients,
  allowedSettings,
  protectionOnly = false,
  isSinglePolicy = false,
}: {
  safe: SafeAccountOption
  tokens: Marked<AccountToken>[]
  recipients: Marked<Recipient>[]
  /** Titles of the Safe account settings left selected. */
  allowedSettings: string[]
  /** The protection flow: no allowlist, so only the account settings. */
  protectionOnly?: boolean
  /** A single allowlist: it doesn't touch account changes, so they aren't listed. */
  isSinglePolicy?: boolean
}): ReactElement => (
  // Two cards, as the spending limit review in production: the account on its own, then the rules.
  <div className="flex flex-col gap-3" data-m2-new="New · Policy details card">
    <Card variant="muted" size="none" radius="lg">
      <div className="p-4">
        <SummaryRow label="Applies to">
          {/* One even gap between account, signers, network and value; SafeRowStats renders its cells as siblings. */}
          <div className="flex min-h-10 flex-wrap items-center gap-x-8 gap-y-2">
            <div className="min-w-0">
              <SafeAddress name={safe.name} address={safe.address} />
            </div>
            <SafeRowStats
              threshold={safe.threshold ?? 0}
              owners={safe.owners ?? 0}
              chains={toStatChains([safe])}
              pending={0}
              showPending={false}
              fitColumns
            />
            <AccountBalance fiatTotal={safe.fiatTotal} fitColumn />
          </div>
        </SummaryRow>
      </div>
    </Card>

    <Card variant="muted" size="none" radius="lg">
      <div className="flex flex-col p-4">
        {!protectionOnly && (
          <>
            <SummaryRow label="Allowed tokens">
              <SummaryLine className="flex-wrap gap-x-5 gap-y-2">
                {tokens.map(({ symbol, logoUri, change }) => (
                  <span key={symbol} className="flex items-center gap-2">
                    <span className={classnames('flex shrink-0', change === 'removed' && 'opacity-50')}>
                      <TokenIcon logoUri={logoUri} tokenSymbol={symbol} size={24} />
                    </span>
                    <Typography
                      variant="paragraph-small-medium"
                      className={classnames(change === 'removed' && 'text-muted-foreground line-through')}
                    >
                      {symbol}
                    </Typography>
                    {change && <ChangeBadge change={change} />}
                  </span>
                ))}
              </SummaryLine>
            </SummaryRow>

            <Separator className="my-3" />

            <SummaryRow
              label={`Allowed recipients (${recipients.filter(({ change }) => change !== 'removed').length})`}
            >
              {/* The Create step's address layout without the pill; a removed one is dimmed and struck through, as M1's removed limit row. */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                {recipients.map(({ name, address, source, change }) => (
                  <AddressHoverTooltip key={address} address={address} className="flex min-w-0">
                    <AddressPill
                      name={name}
                      address={address}
                      nameSuffix={
                        (source === 'address-book' || findAddressBookContact(address)) && (
                          <AddressBookIcon className="size-4 text-muted-foreground" aria-label="In your address book" />
                        )
                      }
                      isRemoved={change === 'removed'}
                      endSlot={change && <ChangeBadge change={change} />}
                      isPlain
                    />
                  </AddressHoverTooltip>
                ))}
              </div>
            </SummaryRow>

            <Separator className="my-3" />
          </>
        )}

        {/* Closed by default: the title and the count, the list opening underneath. */}
        {!isSinglePolicy && (
          <Collapsible data-m2-new="New · Allowed account changes dropdown">
            <CollapsibleTrigger className="group flex min-h-10 w-full cursor-pointer items-center gap-3 rounded-md text-left focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
              <Typography variant="paragraph-small" className="flex-1">
                Allowed account changes
              </Typography>
              <Typography variant="paragraph-small-medium">{allowedSettings.length}</Typography>
              <ChevronDown
                className="size-4 shrink-0 text-muted-foreground transition-transform group-data-[panel-open]:rotate-180"
                aria-hidden
              />
            </CollapsibleTrigger>
            <CollapsibleContent>
              {/* SummaryRow's grid with an empty label cell, so the list starts where the values above start. */}
              <div className="@container w-full pt-2 pb-1">
                <div className="grid grid-cols-1 gap-1 @md:grid-cols-[176px_1fr] @md:gap-6">
                  <span aria-hidden />
                  <div className="flex flex-col gap-2">
                    {allowedSettings.length > 0 ? (
                      allowedSettings.map((title) => (
                        <Typography key={title} variant="paragraph-small-medium">
                          {title}
                        </Typography>
                      ))
                    ) : (
                      <Typography variant="paragraph-small" color="muted">
                        None. Every change to the Safe account will be blocked.
                      </Typography>
                    )}
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>
    </Card>
  </div>
)

type ChoiceHandlers = {
  choices: SetupChoices
  onChoicesChange: (choices: SetupChoices) => void
}

/** Every failed check stops the setup; an account that already has an allowlist opens the edit flow instead. */
const isBlockingPreflight = (preflight: Preflight): preflight is 'old-version' | 'other-guard' => preflight !== 'ready'

const PreflightFailure = ({ preflight }: { preflight: Exclude<Preflight, 'ready'> }): ReactElement => {
  const { title, description, action, href, tone = 'error' } = PREFLIGHT_FAILURES[preflight]

  return (
    <M2Alert
      tone={tone}
      title={title}
      description={description}
      action={
        action &&
        (href ? (
          <ExternalLink href={href} mode="button">
            {action}
          </ExternalLink>
        ) : (
          <Button variant="outline">{action}</Button>
        ))
      }
    />
  )
}

type DraftFields = { address: string; name: string }

/** "Add a recipient" as a new item at the bottom of the list: Enter or ✓ adds it, ✕ or Esc drops it. */
const RecipientDraftRow = ({
  listedAddresses,
  onConfirm,
  onRemove,
  onNameClick,
  onNameChange,
  onAddressStep,
}: {
  listedAddresses: string[]
  onConfirm: (recipient: Contact) => void
  onRemove: () => void
  /** The name field doubles as the contacts search: clicking it opens the address book under the row. */
  onNameClick?: () => void
  onNameChange?: (name: string) => void
  /** A typed address replaces the contacts, so the address book closes. */
  onAddressStep?: () => void
}): ReactElement => {
  const methods = useForm<DraftFields>({ mode: 'onChange', defaultValues: { address: '', name: '' } })
  const address = methods.watch('address') ?? ''
  const isDuplicate = listedAddresses.includes(address.toLowerCase())
  const isValid = isAddress(address) && !isDuplicate
  const [step, setStep] = useState<'name' | 'address'>('name')
  const name = methods.watch('name')?.trim() ?? ''

  const confirmAddress = methods.handleSubmit(({ address: value }) => {
    if (isAddress(value) && !listedAddresses.includes(value.toLowerCase())) onConfirm({ name, address: value })
  })

  const confirm = (event: FormEvent) => {
    if (step === 'address') return confirmAddress(event)
    event.preventDefault()
    setStep('address')
    onAddressStep?.()
  }

  return (
    // The whole item takes the focus ring, since the fields inside it have no box of their own.
    <ItemSurface
      className="has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring"
      markNew="New · Add a recipient row"
    >
      <FormProvider {...methods}>
        <form
          onSubmit={confirm}
          onKeyDown={(event) => {
            if (event.key !== 'Escape') return
            event.preventDefault()
            event.stopPropagation()
            onRemove()
          }}
          className="flex items-center gap-2"
        >
          {/* SafeAddress's layout: a 24px identicon, an empty circle until the address is valid. */}
          {isValid ? (
            <Identicon address={address} size={24} />
          ) : (
            <span className="size-6 shrink-0 rounded-full bg-muted" aria-hidden />
          )}

          {/* Two steps in one row: the name first, then the address under it, where the short address sits above. */}
          {step === 'name' ? (
            <Input
              autoFocus
              // eslint-disable-next-line no-restricted-syntax -- borderless inline name field inside a row; no Input variant renders it bare
              className="min-w-0 flex-1 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
              placeholder="Search contacts or type a name"
              aria-label="Search contacts or type a name"
              onClick={onNameClick}
              {...methods.register('name', { onChange: (event) => onNameChange?.(event.target.value) })}
            />
          ) : (
            <div className="flex min-w-0 flex-1 flex-col">
              <Typography variant="paragraph-small-medium" className="truncate">
                {name || 'New recipient'}
              </Typography>
              <div className={classnames('min-w-0', INLINE_ADDRESS_INPUT)}>
                <AddressInput
                  name="address"
                  label="Address or ENS"
                  placeholder="Address or ENS"
                  showPrefix={false}
                  focused
                  validate={(value: string) =>
                    listedAddresses.includes(value.toLowerCase()) ? 'Already in the list' : undefined
                  }
                />
              </div>
            </div>
          )}
          <Button
            type="submit"
            variant="ghost"
            size="icon"
            aria-label={step === 'name' ? 'Next' : 'Add recipient'}
            disabled={step === 'address' && !isValid}
          >
            <Check />
          </Button>
          <Button type="button" variant="ghost-muted" size="icon" aria-label="Remove" onClick={onRemove}>
            <X />
          </Button>
        </form>
      </FormProvider>
    </ItemSurface>
  )
}

/** M1's contact list height and slim scrollbar (AddressBookInput's option list); 4px side inset, as the panel table's. */
const CONTACT_LIST_CLASSES = [
  // Fills what the popover has left between search and Add, so Add always stays on screen.
  'min-h-0 flex-1 max-h-[400px] overflow-y-auto px-1 pb-1',
  '[scrollbar-color:var(--border)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar-thumb]:rounded-full',
  '[&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-1.5',
].join(' ')

/** A light line inset to the rows' hover area, as the panel table's row dividers. */
const ContactDivider = (): ReactElement => <div className="h-px bg-border/60" aria-hidden />

/** M1's RecipientGroupHeader (AddressBookInput) restyled as the panel table's header bar. */
const ContactsHeader = ({
  Icon,
  label,
  tooltip,
  count,
}: {
  Icon: LucideIcon
  label: string
  tooltip: string
  count: number
}): ReactElement => (
  // Sticky over a popover-coloured strip, so rows scrolling under it don't show through the inset around the bar.
  <div className="sticky top-0 z-10 bg-popover pb-1">
    <div className="flex h-10 items-center gap-1.5 rounded-lg bg-muted px-4 text-xs leading-4 font-semibold text-muted-foreground uppercase">
      <Icon className="size-3.5 shrink-0" aria-hidden />
      <span className="min-w-0 truncate">{label}</span>
      <Tooltip>
        <TooltipTrigger render={<Info className="size-3.5 shrink-0 cursor-help" />} />
        <TooltipContent>{tooltip}</TooltipContent>
      </Tooltip>
      <span className="ml-auto">{count}</span>
    </div>
  </div>
)

// Built here: the app's address book hooks come back empty without a resolved Workspace and chain in the story URL.
const WORKSPACE_CONTACTS: Contact[] = ADDRESS_BOOK.map((contact) => {
  const { name, address } = toSpaceContact(contact)
  return { name, address }
})

/** Contacts saved only in this browser (M1's "Local contacts"), listed under the Workspace's. */
const LOCAL_CONTACTS: Contact[] = [
  { name: 'savings-safe', address: '0x6a1b2c3d4e5f60718293a4b5c6d7e8f901a2b3c4' },
  { name: 'vault-safe', address: '0x7b2c3d4e5f60718293a4b5c6d7e8f901a2b3c4d5' },
  { name: 'payments-team.eth', address: '0x8c3d4e5f60718293a4b5c6d7e8f901a2b3c4d5e6' },
]

const CONTACT_GROUPS: { id: string; Icon: LucideIcon; label: string; tooltip: string; contacts: Contact[] }[] = [
  {
    id: 'workspace',
    Icon: Building2,
    label: `Contacts of ${SPACE_NAME}`,
    tooltip: `Shared with everyone in ${SPACE_NAME}. Only Workspace admins can add or change these contacts.`,
    contacts: WORKSPACE_CONTACTS,
  },
  {
    id: 'local',
    Icon: HardDrive,
    label: 'Local contacts',
    tooltip: "Saved in this browser only. Other members of the Workspace can't see them.",
    contacts: LOCAL_CONTACTS,
  },
]

const ALL_CONTACTS = CONTACT_GROUPS.flatMap(({ contacts }) => contacts)

/** The contacts M1's recipient field lists, as a checkbox list; contacts already listed are locked on. */
const AddFromAddressBook = ({
  open,
  onOpenChange,
  listedAddresses,
  onAdd,
  anchorRef,
  externalQuery,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  listedAddresses: string[]
  onAdd: (contacts: Contact[]) => void
  /** Opens under this element instead of its own button, searched by `externalQuery` (the recipient row's field). */
  anchorRef?: RefObject<HTMLDivElement | null>
  externalQuery?: string
}): ReactElement => {
  const [ownQuery, setQuery] = useState('')
  const query = externalQuery ?? ownQuery
  const [picked, setPicked] = useState<string[]>([])
  const triggerRef = useRef<HTMLButtonElement>(null)
  const search = query.trim().toLowerCase()
  const groups = CONTACT_GROUPS.map((group) => ({
    ...group,
    contacts: group.contacts.filter(
      ({ name, address }) => !search || `${name} ${address}`.toLowerCase().includes(search),
    ),
  })).filter(({ contacts }) => contacts.length > 0)

  // Opening scrolls the button towards the middle of the screen, so the list has room below it and Add stays in view.
  useEffect(() => {
    if (!open) return
    const frame = requestAnimationFrame(() =>
      (anchorRef?.current ?? triggerRef.current)?.scrollIntoView({ block: 'center', behavior: 'smooth' }),
    )
    return () => cancelAnimationFrame(frame)
  }, [open, anchorRef])

  const changeOpen = (next: boolean, details?: { event?: Event }) => {
    // A click back into the row's field is outside the popover, but it's where the search is typed: stay open.
    const target = details?.event?.target
    if (!next && anchorRef?.current && target instanceof Node && anchorRef.current.contains(target)) return
    if (!next) {
      setQuery('')
      setPicked([])
    }
    onOpenChange(next)
  }

  const togglePick = (address: string) =>
    setPicked((current) =>
      current.includes(address) ? current.filter((item) => item !== address) : [...current, address],
    )

  const add = () => {
    onAdd(ALL_CONTACTS.filter(({ address }) => picked.includes(address.toLowerCase())))
    changeOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={changeOpen}>
      {!anchorRef && (
        <PopoverTrigger ref={triggerRef} render={<Button variant="outline" size="sm" />}>
          Add from address book
        </PopoverTrigger>
      )}
      {/* Capped at the room below the button: search and Add stay put, only the contact list scrolls. */}
      <PopoverContent
        anchor={anchorRef}
        align={anchorRef ? 'start' : 'end'}
        side="bottom"
        sideOffset={4}
        collisionAvoidance={{ side: 'none' }}
        // Under the row, focus stays in its field so typing keeps searching.
        initialFocus={anchorRef ? false : undefined}
        className={classnames(
          'flex max-h-(--available-height) max-w-[calc(100vw-32px)] flex-col gap-0 overflow-hidden rounded-lg p-0 shadow-lg ring-1 ring-foreground/10',
          anchorRef ? 'w-(--anchor-width)' : 'w-[480px]',
        )}
        data-m2-new="New · Address book popover"
        data-m2-new-corner="end"
      >
        {!anchorRef && (
          <div className="shrink-0 p-2">
            <SearchInput
              inputSize="sm"
              className="w-full"
              placeholder="Search contacts"
              aria-label="Search contacts"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onClear={() => setQuery('')}
            />
          </div>
        )}

        {groups.length === 0 ? (
          <div className="px-4 pb-3">
            <MutedLine>No contacts found.</MutedLine>
          </div>
        ) : (
          <div className={CONTACT_LIST_CLASSES}>
            {groups.map(({ id, Icon, label, tooltip, contacts }) => (
              <section key={id} className="pb-1">
                <ContactsHeader Icon={Icon} label={label} tooltip={tooltip} count={contacts.length} />
                <ul className="flex flex-col">
                  {contacts.map((contact, index) => {
                    const key = contact.address.toLowerCase()
                    const isListed = listedAddresses.includes(key)

                    return (
                      // 4px above and below the divider, so a row's hover fill never touches the lines.
                      <li key={key} className="py-0.5">
                        {index > 0 && (
                          <div className="pb-1">
                            <ContactDivider />
                          </div>
                        )}
                        <div
                          // Every row gets the table's hover fill; only rows that can still be picked get the pointer.
                          className={classnames(
                            'flex items-center gap-3 rounded-lg px-4 py-3 transition-colors hover:bg-foreground/5',
                            isListed ? 'cursor-default' : 'cursor-pointer',
                          )}
                          onClick={isListed ? undefined : () => togglePick(key)}
                        >
                          <div className="min-w-0 flex-1">
                            <SafeAddress name={contact.name} address={contact.address} avatarSize={24} />
                          </div>
                          {/* The row toggles too, so a click on the box itself must not reach it and toggle twice. */}
                          <span className="flex shrink-0" onClick={(event) => event.stopPropagation()}>
                            <Checkbox
                              checked={isListed || picked.includes(key)}
                              disabled={isListed}
                              onCheckedChange={() => togglePick(key)}
                              aria-label={`Add ${contact.name}`}
                            />
                          </span>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </section>
            ))}
          </div>
        )}

        <div className="shrink-0 px-1">
          <ContactDivider />
        </div>
        <div className="shrink-0 p-2">
          <Button className="w-full" disabled={picked.length === 0} onClick={add}>
            Add
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

const TokenLabel = ({ token }: { token: AccountToken }): ReactElement => (
  <span className="flex min-w-0 flex-1 items-center gap-3">
    <TokenIcon logoUri={token.logoUri} tokenSymbol={token.symbol} size={24} />
    <span className="flex min-w-0 flex-col text-left">
      <Typography variant="paragraph-small-medium" as="span">
        {token.symbol}
      </Typography>
      <Typography variant="paragraph-small" color="muted" as="span">
        {token.name}
      </Typography>
    </span>
  </span>
)

type TokenGroup = { value: string; label: string; items: AccountToken[] }

/** M1's token search (matchesTokenQuery): symbol, name, or a pasted address. */
const matchesToken = ({ symbol, name, address }: AccountToken, query: string): boolean => {
  const search = query.trim().toLowerCase()
  return !search || [symbol, name, address ?? ''].some((value) => value.toLowerCase().includes(search))
}

/** "Add a token" as a new row that searches like M1's TokenSelector; closing without a pick drops the row. */
const TokenDraftRow = ({
  addable,
  onConfirm,
  onRemove,
}: {
  addable: AccountToken[]
  onConfirm: (symbol: string) => void
  onRemove: () => void
}): ReactElement => {
  const anchor = useComboboxAnchor()
  const [query, setQuery] = useState('')
  const groups: TokenGroup[] = addable.length > 0 ? [{ value: 'popular', label: 'Popular', items: addable }] : []
  const isTyping = query.trim() !== ''
  // ✓ adds the first token the typed text matches, as Enter on the highlighted one would.
  const firstMatch = isTyping ? addable.find((token) => matchesToken(token, query)) : undefined

  return (
    // The anchor is the whole item, so the list opens under it at its width, like the account field's.
    <div ref={anchor} className="rounded-lg bg-card" data-m2-new="New · Add a token row">
      <Combobox<AccountToken>
        items={groups}
        defaultOpen
        openOnInputClick
        autoHighlight
        itemToStringLabel={(token) => token.symbol}
        itemToStringValue={(token) => token.symbol}
        filter={(token, value) => matchesToken(token, value)}
        onInputValueChange={(value) => setQuery(value)}
        onValueChange={(token) => {
          if (token) onConfirm(token.symbol)
        }}
        // Once something is typed the row stays, like the recipient row, until ✓ or ✕; empty, closing drops it.
        onOpenChange={(open) => {
          if (!open && !isTyping) onRemove()
        }}
      >
        <ComboboxInput
          autoFocus
          aria-label="Token"
          placeholder="Search by name or address"
          showTrigger={!isTyping}
          // Spacing set explicitly to the token rows': icon 12px in, text 12px after the 24px icon box.
          className="h-16 w-full rounded-lg border-0 bg-transparent px-0 shadow-none focus-within:ring-0 has-[[data-slot=input-group-control]:focus-visible]:ring-0 [&_[data-slot=input-group-control]]:!pl-3"
        >
          {/* A 24px box, the token icons' size, so the search icon centres on the same column as the icons above. */}
          <InputGroupAddon align="inline-start" className="!pr-0 !pl-3">
            <span className="flex size-6 shrink-0 items-center justify-center" aria-hidden>
              <Search className="size-4 text-muted-foreground" />
            </span>
          </InputGroupAddon>

          {/* The recipient row's ✓ and ✕, once something is typed. Mouse down keeps focus in the field. */}
          {isTyping && (
            <InputGroupAddon align="inline-end" className="gap-2 !pr-3">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Add token"
                disabled={!firstMatch}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => firstMatch && onConfirm(firstMatch.symbol)}
              >
                <Check />
              </Button>
              <Button
                type="button"
                variant="ghost-muted"
                size="icon"
                aria-label="Remove"
                onMouseDown={(event) => event.preventDefault()}
                onClick={onRemove}
              >
                <X />
              </Button>
            </InputGroupAddon>
          )}
        </ComboboxInput>

        <BelowComboboxContent
          anchor={anchor}
          data-m2-dropdown=""
          data-m2-new="M1 copy · Token dropdown (opens below)"
          data-m2-new-corner="end"
          className="max-h-80"
        >
          <ComboboxEmpty>No tokens found</ComboboxEmpty>
          <ComboboxList>
            {(group: TokenGroup) => (
              <ComboboxGroup key={group.value} items={group.items}>
                <ComboboxLabel>{group.label}</ComboboxLabel>
                <ComboboxCollection>
                  {(token: AccountToken) => (
                    // The list's 4px inset + 8px here = 12px, the rows' own padding, so the icons share one column.
                    <ComboboxItem key={token.symbol} value={token} className="rounded-[10px] px-2">
                      <TokenLabel token={token} />
                    </ComboboxItem>
                  )}
                </ComboboxCollection>
              </ComboboxGroup>
            )}
          </ComboboxList>
        </BelowComboboxContent>
      </Combobox>
    </div>
  )
}

/**
 * A token or recipient the allowlist can include, styled and stated like the outline Button
 * (packages/views button.tsx): on is its default, on white so it stands out on the grey section; off is its
 * disabled look at half opacity, but still clickable to turn it back on. 7px left inset centres the 24px icon.
 */
/** Name (with any suffix) over the monospaced short address; the name truncates in a fixed-width pill. */
const AddressChipText = ({
  name,
  address,
  nameSuffix,
  className,
}: {
  name: string
  address: string
  nameSuffix?: ReactNode
  className?: string
}): ReactElement => (
  <span className={classnames('flex min-w-0 flex-1 flex-col items-start gap-1 text-left', className)}>
    <span className="flex w-full min-w-0 items-center gap-1">
      <span className="truncate">{name}</span>
      {nameSuffix && <span className="flex shrink-0">{nameSuffix}</span>}
    </span>
    <ShortAddress address={address} />
  </span>
)

/** The pill's look without the toggle, for read-only lists such as Review: a white pill, grey outline, no ✓. */
const AddressPill = ({
  name,
  address,
  nameSuffix,
  isRemoved = false,
  endSlot,
  isPlain = false,
}: {
  name: string
  address: string
  nameSuffix?: ReactNode
  /** Just the identicon, name and address, without the pill's outline, fill and padding. */
  isPlain?: boolean
  isRemoved?: boolean
  /** E.g. an Added/Removed badge. */
  endSlot?: ReactNode
}): ReactElement => (
  <div
    className={classnames(
      'flex w-full min-w-0 items-center gap-2 text-sm leading-none font-medium',
      !isPlain && 'rounded-full border border-border bg-card py-[7px] pr-3.5 pl-2.5 shadow-xs',
    )}
    data-m2-new="New · Address pill"
  >
    <span className={classnames('flex shrink-0', isRemoved && 'opacity-50')}>
      <Identicon address={address} size={24} />
    </span>
    <AddressChipText
      name={name}
      address={address}
      nameSuffix={nameSuffix}
      className={classnames(isRemoved && 'line-through opacity-50')}
    />
    {endSlot && <span className="ml-2 flex shrink-0">{endSlot}</span>}
  </div>
)

const SelectableChip = ({
  isSelected,
  onToggle,
  icon,
  label,
  labelSuffix,
  detail,
  subline,
  isFullWidth = false,
  ariaLabel,
}: {
  isSelected: boolean
  onToggle: () => void
  icon: ReactNode
  label: string
  /** Right after the label, e.g. the address book icon. */
  labelSuffix?: ReactNode
  /** Muted after the label, e.g. an amount. */
  detail?: string
  /** A second line under the label, e.g. a Safe account's address: the chip grows to two lines. */
  subline?: ReactNode
  /** Fills its grid cell, the label truncating, so every chip in the grid has one width. */
  isFullWidth?: boolean
  ariaLabel: string
}): ReactElement => (
  <Toggle
    variant="outline"
    size="lg"
    pressed={isSelected}
    onPressedChange={onToggle}
    aria-label={ariaLabel}
    className={classnames(
      'gap-2 rounded-full border-border bg-transparent pr-3.5 pl-[7px] leading-none shadow-xs hover:bg-foreground/[0.06] hover:text-foreground aria-pressed:bg-card aria-pressed:hover:bg-card/80',
      // Two lines with a 24px icon: 10px around it, so the inset matches top, bottom and left.
      Boolean(subline) && 'h-auto py-[7px] pl-2.5',
      isFullWidth && 'w-full min-w-0 justify-start',
      // Hovering an off chip previews it on: full opacity on white, still without the ✓.
      !isSelected && 'opacity-50 hover:bg-card hover:opacity-100',
    )}
  >
    <span className="flex shrink-0">{icon}</span>
    {subline ? (
      <span className="flex min-w-0 flex-1 flex-col items-start gap-1 text-left">
        <span className="flex w-full min-w-0 items-center gap-1">
          <span className="truncate">{label}</span>
          {labelSuffix && <span className="flex shrink-0">{labelSuffix}</span>}
        </span>
        {subline}
      </span>
    ) : (
      <span className={classnames('flex min-w-0 items-center gap-2', isFullWidth && 'flex-1')}>
        <span className="shrink-0">{label}</span>
        {labelSuffix}
        {detail && <span className="truncate font-normal text-muted-foreground">{detail}</span>}
      </span>
    )}
    {/* On hover a selected chip shows ✕ instead of ✓: clicking it takes the item out. */}
    {isSelected && (
      <span className="ml-2 flex size-5 shrink-0 items-center justify-center rounded-full bg-muted">
        <Check className="size-3 group-hover/toggle:hidden" aria-hidden />
        <X className="hidden size-3 group-hover/toggle:block" aria-hidden />
      </span>
    )}
  </Toggle>
)

/** One checkbox per token, all checked by default. */
const TokensGroup = ({
  account,
  choices,
  onChoicesChange,
  sectionRef,
  isEditMode = false,
}: ChoiceHandlers & {
  account?: M2Account
  sectionRef?: Ref<HTMLElement>
  isEditMode?: boolean
}): ReactElement => {
  const [isDrafting, setIsDrafting] = useState(false)
  const tokens = getFormTokens(choices, account)
  const addable = POPULAR_TOKENS.filter(({ symbol }) => !tokens.some((token) => token.symbol === symbol))

  const toggle = (symbol: string) =>
    onChoicesChange({
      ...choices,
      excludedTokens: choices.excludedTokens.includes(symbol)
        ? choices.excludedTokens.filter((excluded) => excluded !== symbol)
        : [...choices.excludedTokens, symbol],
    })

  const symbols = tokens.map(({ symbol }) => symbol)
  const isAllSelected = symbols.every((symbol) => !choices.excludedTokens.includes(symbol))
  const setAll = (isSelected: boolean) =>
    onChoicesChange({
      ...choices,
      excludedTokens: isSelected
        ? choices.excludedTokens.filter((excluded) => !symbols.includes(excluded))
        : Array.from(new Set([...choices.excludedTokens, ...symbols])),
    })

  const add = (symbol: string) => {
    onChoicesChange({
      ...choices,
      addedTokens: [...choices.addedTokens, symbol],
      excludedTokens: choices.excludedTokens.filter((excluded) => excluded !== symbol),
    })
    setIsDrafting(false)
  }

  return (
    <GroupSurface
      title="Which tokens can be sent"
      sectionRef={sectionRef}
      markNew="New · Token chips"
      description={
        !account
          ? 'Pick a Safe account to choose from its tokens.'
          : isEditMode
            ? 'These are the tokens the allowlist allows today. Add a token or deselect one to change it.'
            : 'Only transactions of the tokens selected below will be allowed.'
      }
    >
      {tokens.length === 0 ? (
        <EmptyItem>Tokens in this account will show here.</EmptyItem>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(8rem,1fr))] gap-2" data-m2-new="New · Token chips">
          {/* Equal-width chips, as many per row as fit (4 in the card at full width), sized for symbols like WBTC or stETH. */}
          {tokens.map(({ symbol, logoUri }) => (
            <SelectableChip
              key={symbol}
              isSelected={!choices.excludedTokens.includes(symbol)}
              onToggle={() => toggle(symbol)}
              icon={<TokenIcon logoUri={logoUri} tokenSymbol={symbol} size={24} />}
              label={symbol}
              isFullWidth
              ariaLabel={`Allow ${symbol}`}
            />
          ))}
        </div>
      )}

      {isDrafting && <TokenDraftRow addable={addable} onConfirm={add} onRemove={() => setIsDrafting(false)} />}

      {/* Like M1's token field, adding waits for a Safe account. */}
      <div className="flex items-center justify-between gap-2">
        {tokens.length > 0 ? (
          <Button variant="ghost" size="sm" onClick={() => setAll(!isAllSelected)}>
            {isAllSelected ? 'Deselect all' : 'Select all'}
          </Button>
        ) : (
          <span />
        )}
        <Button
          variant="outline"
          size="sm"
          disabled={!account || addable.length === 0}
          onClick={() => setIsDrafting(true)}
        >
          <Plus data-icon="inline-start" />
          Add a token
        </Button>
      </div>
    </GroupSurface>
  )
}

/** A grey item standing in for a list that fills once a Safe account is picked. */
const EmptyItem = ({ children }: { children: ReactNode }): ReactElement => (
  <ItemSurface>
    <MutedLine>{children}</MutedLine>
  </ItemSurface>
)

/** Asks the layout for room below the page while the address book is open, so the page can scroll the list up. */
const PageRoomContext = createContext<(isNeeded: boolean) => void>(() => {})

/** Shown from the start, as M1's spender field is; picking the account brings in the suggested recipients. */
const RecipientsGroup = ({
  account,
  choices,
  onChoicesChange,
  isEditMode = false,
}: ChoiceHandlers & { account?: M2Account; isEditMode?: boolean }): ReactElement => {
  const [isBookOpen, setIsBookOpen] = useState(false)
  // With no recipients yet, the entry row starts open, so the first one can be typed straight away.
  const [isDrafting, setIsDrafting] = useState(() => getShownRecipients(choices, account).length === 0)
  const [draftQuery, setDraftQuery] = useState('')
  const draftRef = useRef<HTMLDivElement>(null)
  const endDraft = () => {
    setIsDrafting(false)
    setIsBookOpen(false)
    setDraftQuery('')
  }
  const reservePageRoom = useContext(PageRoomContext)
  const recipients = getShownRecipients(choices, account)

  useEffect(() => {
    reservePageRoom(isBookOpen)
    return () => reservePageRoom(false)
  }, [isBookOpen, reservePageRoom])
  const listedAddresses = recipients.map(({ address }) => address.toLowerCase())
  const isEmpty = recipients.length === 0
  const description = !account
    ? undefined
    : isEditMode
      ? 'These are the recipients the allowlist allows today. Add a recipient or deselect one to change it.'
      : 'Only transactions to the recipients selected below will be allowed.'

  const toggle = (address: string) =>
    onChoicesChange({
      ...choices,
      recipients: choices.recipients.map((recipient) =>
        recipient.address === address ? { ...recipient, selected: !recipient.selected } : recipient,
      ),
    })

  const addTyped = ({ name, address }: Contact) => {
    onChoicesChange({
      ...choices,
      recipients: [...choices.recipients, { name: name || 'New recipient', address, selected: true }],
    })
    endDraft()
  }

  // A contact already held but hidden (a suggestion, before an account is picked) is replaced, not listed twice.
  const addFromBook = (contacts: Contact[]) => {
    const added = contacts.map(({ address }) => address.toLowerCase())
    onChoicesChange({
      ...choices,
      recipients: [
        ...choices.recipients.filter(({ address }) => !added.includes(address.toLowerCase())),
        ...contacts.map((contact) => ({ ...contact, source: 'address-book' as const, selected: true })),
      ],
    })
    endDraft()
  }

  return (
    <GroupSurface title="Who can receive funds" description={description} markNew="New · Recipient chips">
      {isEmpty && !isDrafting ? (
        !account && <EmptyItem>Recipients will show here.</EmptyItem>
      ) : (
        <div className="flex flex-col gap-3">
          {recipients.length > 0 && (
            <div className="grid grid-cols-3 gap-2" data-m2-new="New · Recipient chips">
              {recipients.map((recipient) => (
                <AddressHoverTooltip
                  key={recipient.address}
                  address={recipient.address}
                  chainId={account?.chainId}
                  note={recipient.history && `${recipient.history.count} transactions · last ${recipient.history.last}`}
                  className="flex min-w-0"
                >
                  <SelectableChip
                    isSelected={recipient.selected}
                    onToggle={() => toggle(recipient.address)}
                    icon={<Identicon address={recipient.address} size={24} />}
                    label={recipient.name}
                    labelSuffix={
                      (recipient.source === 'address-book' || findAddressBookContact(recipient.address)) && (
                        <AddressBookIcon className="size-4 text-muted-foreground" aria-label="In your address book" />
                      )
                    }
                    subline={<ShortAddress address={recipient.address} />}
                    isFullWidth
                    ariaLabel={`Allow ${recipient.name}`}
                  />
                </AddressHoverTooltip>
              ))}
            </div>
          )}
          {isDrafting && (
            <div ref={draftRef}>
              <RecipientDraftRow
                listedAddresses={listedAddresses}
                onConfirm={addTyped}
                onRemove={endDraft}
                onNameClick={() => setIsBookOpen(true)}
                onNameChange={(name) => {
                  setDraftQuery(name)
                  setIsBookOpen(true)
                }}
                onAddressStep={() => setIsBookOpen(false)}
              />
            </div>
          )}
        </div>
      )}

      <AddFromAddressBook
        open={isDrafting && isBookOpen}
        onOpenChange={setIsBookOpen}
        listedAddresses={listedAddresses}
        onAdd={addFromBook}
        anchorRef={draftRef}
        externalQuery={draftQuery}
      />

      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setIsDrafting(true)
            setIsBookOpen(true)
          }}
        >
          <Plus data-icon="inline-start" />
          Add a recipient
        </Button>
      </div>
    </GroupSurface>
  )
}

/** M1's action row (SpendingLimitPolicyForm): a submit-sized Button in TxCardActions. */
const PrimaryAction = ({
  label,
  disabled,
  disabledHint,
  onClick,
}: {
  label: string
  disabled?: boolean
  /** Why the button is off, in a tooltip; a disabled button gets no hover, so the wrapper takes it. */
  disabledHint?: string
  onClick?: () => void
}): ReactElement => {
  const button = (
    <Button type="button" size="submit" disabled={disabled} onClick={onClick}>
      {label}
    </Button>
  )

  return (
    <TxCardActions>
      {disabled && disabledHint ? (
        <Tooltip>
          <TooltipTrigger render={<span className="inline-flex" />}>{button}</TooltipTrigger>
          <TooltipContent>{disabledHint}</TooltipContent>
        </Tooltip>
      ) : (
        button
      )}
    </TxCardActions>
  )
}

/** One form, laid out like M1's SpendingLimitPolicyForm: blocks stacked with its `gap-5`, Next at the bottom. */
const CreateStep = ({
  account,
  choices,
  onChoicesChange,
  preflight,
  preflightBanner,
  onNext,
  isEditMode = false,
  isUnchangedEdit = false,
  scrollToTokens = false,
  onScrolledToTokens,
}: ChoiceHandlers & {
  account?: M2Account
  preflight: Preflight
  preflightBanner?: ReactNode
  onNext: () => void
  /** M1's edit mode: the account fixed. */
  isEditMode?: boolean
  /** The edit allows what the live allowlist does, so Next stays off, as in M1. */
  isUnchangedEdit?: boolean
  /** Set by "Change tokens" on the Permissions step: scroll to the tokens once this step shows. */
  scrollToTokens?: boolean
  onScrolledToTokens?: () => void
}): ReactElement => {
  const hasRecipient = getShownRecipients(choices, account).some((recipient) => recipient.selected)
  const hasToken = getAllowedTokens(choices, account).length > 0
  const tokensRef = useRef<HTMLElement>(null)

  // Two frames: the layout resets the scroll to the top in the first, after this effect, so the tokens scroll in the next.
  useEffect(() => {
    if (!scrollToTokens) return
    let inner = 0
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => {
        tokensRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        onScrolledToTokens?.()
      })
    })
    return () => {
      cancelAnimationFrame(outer)
      cancelAnimationFrame(inner)
    }
  }, [scrollToTokens, onScrolledToTokens])

  return (
    <TxCard>
      <div className="flex flex-col gap-5">
        {/* A failed check leaves only the account and its banner: there is nothing to set up until it's resolved. */}
        {account && isBlockingPreflight(preflight) ? (
          (preflightBanner ?? <PreflightFailure preflight={preflight} />)
        ) : (
          <div className="flex min-w-0 flex-col gap-4">
            <TokensGroup
              account={account}
              choices={choices}
              onChoicesChange={onChoicesChange}
              sectionRef={tokensRef}
              isEditMode={isEditMode}
            />
            <RecipientsGroup
              account={account}
              choices={choices}
              onChoicesChange={onChoicesChange}
              isEditMode={isEditMode}
            />
          </div>
        )}

        <PrimaryAction
          label="Next"
          disabled={!account || isBlockingPreflight(preflight) || !hasToken || !hasRecipient || isUnchangedEdit}
          onClick={onNext}
        />
      </div>
    </TxCard>
  )
}

/** M1's confirm-screen block (SpendingLimitSummary): callout, "Applies to", then one surface per subject. */
const PolicySummary = ({
  choices,
  account = PAYMENTS,
  initialChoices,
  protectionOnly,
  isSinglePolicy,
}: {
  choices: SetupChoices
  account?: M2Account
  protectionOnly?: boolean
  isSinglePolicy?: boolean
  /** Edit only: the live allowlist, so the card marks what the edit adds and removes. */
  initialChoices?: SetupChoices
}): ReactElement => {
  const selected = getSelectedRecipients(choices)
  const tokens = getAllowedTokens(choices, account)
  const safe = toSafeAccountOption(account)

  return (
    <div className="flex flex-col gap-3">
      <PolicyDetailsCard
        safe={safe}
        tokens={initialChoices ? markChanges(tokens, getAllowedTokens(initialChoices, account), tokenKey) : tokens}
        recipients={
          initialChoices ? markChanges(selected, getSelectedRecipients(initialChoices), recipientKey) : selected
        }
        allowedSettings={getAllowedSettings(choices).map(({ title }) => title)}
        protectionOnly={protectionOnly}
        isSinglePolicy={isSinglePolicy}
      />
    </div>
  )
}

/** Something that can already send funds from the account without every signer; spending limits only, so far. */
type ExistingPermission = {
  id: string
  kind: string
  holder: string
  /** What it allows, e.g. "500 USDC per day". */
  detail: string
  token: string
  Icon: LucideIcon
}

const getExistingPermissions = (account: M2Account): ExistingPermission[] =>
  getAccountSpendingLimits(account).map(({ spender, token, label }) => ({
    id: `spending-limit:${spender}`,
    kind: 'Spending limit',
    holder: spender,
    // The mock label is "Ops bot · 500 USDC per day"; the row shows the name and the amount on separate lines.
    detail: label.split(' · ').slice(1).join(' · '),
    token,
    Icon: POLICY_ICONS['spending-limit'],
  }))

/** Policy enforcement on its own adds an allowlist in the same setup when picked on its Policies step. */
export const setupAddsAllowlist = (_account: M2Account | undefined, choices: SetupChoices): boolean =>
  choices.addAllowlist ?? true

type AccountSetting = { id: string; title: string; description: string; note?: string }

/** The Safe account changes the allowlist can still let through, in plain words: no "guard" or "module". */
export const ACCOUNT_SETTING_GROUPS: { title: string; settings: AccountSetting[] }[] = [
  {
    title: 'Signers',
    settings: [
      {
        id: 'add-signer',
        title: 'Add a signer',
        description: 'Adds a signer and sets how many signatures are needed.',
      },
      {
        id: 'remove-signer',
        title: 'Remove a signer',
        description: 'Removes a signer and sets how many signatures are needed.',
      },
      {
        id: 'replace-signer',
        title: 'Replace a signer',
        description: 'Swaps one signer for another. The number of signatures needed stays the same.',
      },
      {
        id: 'change-threshold',
        title: 'Change the threshold',
        description: 'Changes how many signatures a transaction needs.',
      },
    ],
  },
  {
    title: 'Policies',
    settings: [
      {
        id: 'add-policy',
        title: 'Add a policy',
        description: 'Lets you add policies such as spending limits and proposers.',
        note: 'Needed to add a spending limit after this setup.',
      },
      {
        id: 'remove-policy',
        title: 'Remove a policy',
        description: 'Lets you remove policies such as spending limits and proposers.',
      },
      {
        id: 'change-policy-checks',
        title: 'Change how existing policies are checked',
        description: 'Replaces the check that applies to spending limits and other policies.',
      },
      {
        id: 'change-allowlist',
        title: 'Turn off or replace policy enforcement',
        description: 'Includes its account settings and allowlist.',
      },
    ],
  },
  {
    title: 'Advanced',
    settings: [
      {
        id: 'change-fallback',
        title: 'Change how unknown calls are handled',
        description: 'Replaces the contract that answers calls the Safe account has no function for.',
      },
      {
        id: 'batch',
        title: 'Batched transactions',
        description: 'Several changes in one transaction. Each one is still checked.',
      },
    ],
  },
]

const ALL_ACCOUNT_SETTINGS = ACCOUNT_SETTING_GROUPS.flatMap(({ settings }) => settings)

/** The settings left selected, in their listed order. */
const getAllowedSettings = (choices: SetupChoices): AccountSetting[] =>
  ALL_ACCOUNT_SETTINGS.filter(({ id }) => !choices.blockedSettings.includes(id))

/** One group of settings: a grey section, its rows white inside it, Select all / Deselect all at the top right. */
const SettingsGroup = ({
  title,
  settings,
  choices,
  onChoicesChange,
}: ChoiceHandlers & { title: string; settings: AccountSetting[] }): ReactElement => {
  const ids = settings.map(({ id }) => id)
  // Ticked means blocked: everything starts allowed, and people pick what to block.
  const isAllSelected = ids.every((id) => choices.blockedSettings.includes(id))

  const toggle = (id: string) =>
    onChoicesChange({
      ...choices,
      blockedSettings: choices.blockedSettings.includes(id)
        ? choices.blockedSettings.filter((blocked) => blocked !== id)
        : [...choices.blockedSettings, id],
    })
  const setAll = (isSelected: boolean) =>
    onChoicesChange({
      ...choices,
      blockedSettings: isSelected
        ? Array.from(new Set([...choices.blockedSettings, ...ids]))
        : choices.blockedSettings.filter((blocked) => !ids.includes(blocked)),
    })

  return (
    <GroupSurface
      title={title}
      markNew="New · Safe account settings"
      action={
        <Button variant="ghost" size="sm" onClick={() => setAll(!isAllSelected)}>
          {isAllSelected ? 'Unblock all' : 'Block all'}
        </Button>
      }
    >
      <ItemList>
        {settings.map(({ id, title: settingTitle, description, note }) => {
          const checkboxId = `account-setting-${id}`

          return (
            <ItemSurface key={id}>
              <label htmlFor={checkboxId} className="flex cursor-pointer items-center gap-3">
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <Typography variant="paragraph-small-medium">{settingTitle}</Typography>
                  <MutedLine>{description}</MutedLine>
                  {note && (
                    <Typography variant="paragraph-small" className="text-success-strong">
                      {note}
                    </Typography>
                  )}
                </div>
                <Checkbox
                  id={checkboxId}
                  checked={choices.blockedSettings.includes(id)}
                  onCheckedChange={() => toggle(id)}
                />
              </label>
            </ItemSurface>
          )
        })}
      </ItemList>
    </GroupSurface>
  )
}

/**
 * One 7-second loop, left to right: three signatures tick in, a pulse runs along the line to the protection, it
 * checks, then a pulse runs down each branch and its outcome lights up, green then red. Reduced motion: the end state.
 */
const PROTECTION_DIAGRAM_CSS = `
.m2-diagram-sig { background: var(--foreground); border-color: var(--foreground); color: var(--background); }
.m2-diagram-allowed { background: var(--color-success-background); color: var(--color-success-dark); }
.m2-diagram-blocked { background: color-mix(in srgb, var(--destructive) 12%, var(--card)); color: var(--destructive); }
.m2-diagram-pulse { stroke-dasharray: 30 100; stroke-dashoffset: 30; }
@keyframes m2-diagram-sig {
  0%, 4% { background: transparent; border-color: var(--border); color: transparent; }
  8%, 90% { background: var(--foreground); border-color: var(--foreground); color: var(--background); }
  96%, 100% { background: transparent; border-color: var(--border); color: transparent; }
}
@keyframes m2-diagram-pulse-1 {
  0%, 22% { stroke-dashoffset: 30; }
  34%, 100% { stroke-dashoffset: -100; }
}
@keyframes m2-diagram-check {
  0%, 34% { transform: scale(1); box-shadow: 0 0 0 0 transparent; }
  39% { transform: scale(1.08); box-shadow: 0 0 0 6px color-mix(in srgb, var(--mint) 60%, transparent); }
  45% { transform: scale(1); box-shadow: 0 0 0 0 transparent; }
  49% { transform: scale(1.08); box-shadow: 0 0 0 6px color-mix(in srgb, var(--mint) 60%, transparent); }
  55%, 100% { transform: scale(1); box-shadow: 0 0 0 12px transparent; }
}
@keyframes m2-diagram-pulse-2 {
  0%, 55% { stroke-dashoffset: 30; }
  65%, 100% { stroke-dashoffset: -100; }
}
@keyframes m2-diagram-pulse-3 {
  0%, 62% { stroke-dashoffset: 30; }
  72%, 100% { stroke-dashoffset: -100; }
}
@keyframes m2-diagram-allowed {
  0%, 64% { background: var(--card); color: var(--muted-foreground); }
  67%, 90% { background: var(--color-success-background); color: var(--color-success-dark); }
  96%, 100% { background: var(--card); color: var(--muted-foreground); }
}
@keyframes m2-diagram-blocked {
  0%, 71% { background: var(--card); color: var(--muted-foreground); }
  74%, 90% { background: color-mix(in srgb, var(--destructive) 12%, var(--card)); color: var(--destructive); }
  96%, 100% { background: var(--card); color: var(--muted-foreground); }
}
@media (prefers-reduced-motion: no-preference) {
  .m2-diagram-sig { animation: m2-diagram-sig 7s infinite both; }
  .m2-diagram-sig:nth-child(2) { animation-delay: 0.5s; }
  .m2-diagram-sig:nth-child(3) { animation-delay: 1s; }
  .m2-diagram-pulse-1 { animation: m2-diagram-pulse-1 7s infinite both; }
  .m2-diagram-check { animation: m2-diagram-check 7s infinite both; }
  .m2-diagram-pulse-2 { animation: m2-diagram-pulse-2 7s infinite both; }
  .m2-diagram-pulse-3 { animation: m2-diagram-pulse-3 7s infinite both; }
  .m2-diagram-allowed { animation: m2-diagram-allowed 7s infinite both; }
  .m2-diagram-blocked { animation: m2-diagram-blocked 7s infinite both; }
}
`

/** A grey line with a dark pulse that runs along it, left to right. */
const DiagramLine = ({ d, pulseClassName }: { d: string; pulseClassName: string }): ReactElement => (
  <>
    <path d={d} pathLength={100} fill="none" stroke="var(--border)" strokeWidth={2} />
    <path
      d={d}
      pathLength={100}
      fill="none"
      stroke="var(--foreground)"
      strokeWidth={2}
      className={classnames('m2-diagram-pulse', pulseClassName)}
    />
  </>
)

/** Dev's animation: signers approve, the protection checks, the transaction runs or stops. Sized for a 600px dialog. */
export const ProtectionDiagram = (): ReactElement => {
  const node = 'flex flex-col items-center gap-2 text-center'
  const tile = 'relative flex size-9 items-center justify-center rounded-lg'
  const outcome = 'flex h-8 items-center gap-1.5 rounded-md px-2.5'

  return (
    // items-start with 36px-tall connectors: every line meets the middle of the tiles, not of the labels.
    // pt 29px: 12px plus the 17px the outcomes rise above the tiles, so the drawing sits centred.
    <div
      aria-hidden
      className="flex items-start justify-center rounded-lg bg-muted px-3 pt-[29px] pb-3"
      data-m2-new="New · How protection works diagram"
    >
      <style>{PROTECTION_DIAGRAM_CSS}</style>
      <div className={node}>
        <div className={classnames(tile, 'border border-border bg-card')}>
          <UsersRound className="size-4 text-muted-foreground" />
          {/* On the tile's bottom edge, so this step is as tall as the protection one. */}
          <div className="absolute -bottom-1.5 left-1/2 flex -translate-x-1/2 gap-0.5">
            {[0, 1, 2].map((index) => (
              <span
                key={index}
                className="m2-diagram-sig flex size-3.5 items-center justify-center rounded-full border bg-card"
              >
                <Check className="size-2" strokeWidth={3} />
              </span>
            ))}
          </div>
        </div>
        <Typography variant="paragraph-mini-medium">Signers approve</Typography>
      </div>

      <svg width="36" height="36" viewBox="0 0 36 36" className="shrink-0">
        <DiagramLine d="M4 18 H32" pulseClassName="m2-diagram-pulse-1" />
      </svg>

      <div className={node}>
        <div className={classnames(tile, 'm2-diagram-check bg-mint')}>
          <AccountProtectionIcon className="size-4" />
        </div>
        <Typography variant="paragraph-mini-medium">Policies checked</Typography>
      </div>

      {/* 70px tall, centred on the tiles' middle (18px): -17px lifts it into place. */}
      <div className="-mt-[17px] flex items-center">
        <svg width="36" height="70" viewBox="0 0 36 70" className="shrink-0">
          <DiagramLine d="M4 35 C 18 35, 18 16, 32 16" pulseClassName="m2-diagram-pulse-2" />
          <DiagramLine d="M4 35 C 18 35, 18 54, 32 54" pulseClassName="m2-diagram-pulse-3" />
        </svg>
        <div className="flex flex-col gap-1.5">
          <span className={classnames(outcome, 'm2-diagram-allowed')}>
            <Check className="size-3.5" />
            <Typography variant="paragraph-mini-medium" className="text-foreground">
              Allowed: it runs
            </Typography>
          </span>
          <span className={classnames(outcome, 'm2-diagram-blocked')}>
            <X className="size-3.5" />
            <Typography variant="paragraph-mini-medium" className="text-foreground">
              Not allowed: blocked
            </Typography>
          </span>
        </div>
      </div>
    </div>
  )
}

/** In the order they happen: set up the policies, then every transaction is checked, then changes wait. */
export const PROTECTION_FACTS: { Icon: LucideIcon; title: string; description: string }[] = [
  {
    Icon: ListPlus,
    title: 'You set up your policies',
    description: 'Decide what your Safe account can do.',
  },
  {
    Icon: AccountProtectionIcon,
    title: 'Every transaction is checked against your policies',
    description: 'Anything your policies don’t allow is blocked, even with every signature.',
  },
  {
    Icon: Clock,
    title: 'Every change waits 24 hours',
    description: 'Any signer can review it first, so no one can silently get around your policies.',
  },
]

/** The onboarding's first page: the account to protect (when it isn't given), what protection does, then "I understand". */
const IntroStep = ({
  accountField,
  note,
  canContinue = true,
  hasUnderstood,
  onUnderstoodChange,
  onNext,
}: {
  /** From "New": the Safe account to protect, picked here. */
  accountField?: ReactNode
  /** Why protection comes first, when the setup started from a policy. */
  note?: string
  canContinue?: boolean
  hasUnderstood: boolean
  onUnderstoodChange: (hasUnderstood: boolean) => void
  onNext: () => void
}): ReactElement => {
  const checkboxId = useId()

  return (
    <TxCard>
      <div className="flex flex-col gap-5" data-m2-new="New · How it works step">
        {note && <M2Alert tone="info" title={note} />}
        {accountField}

        {/* One fact per line, read top to bottom: what it does, how it's kept safe, what comes next. */}
        <div className="flex flex-col divide-y divide-border rounded-xl bg-muted">
          {PROTECTION_FACTS.map(({ Icon, title, description }) => (
            <div key={title} className="flex items-start gap-4 p-4">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-card">
                <Icon className="size-4" aria-hidden />
              </div>
              <div className="flex flex-col gap-1">
                <Typography variant="paragraph-bold">{title}</Typography>
                <MutedLine>{description}</MutedLine>
              </div>
            </div>
          ))}
        </div>

        <ExternalLink href={HelpCenterArticle.POLICIES} className="text-sm">
          Learn more about policy enforcement
        </ExternalLink>

        <label
          htmlFor={checkboxId}
          className="flex cursor-pointer items-center gap-3 rounded-xl border border-border p-4"
          data-m2-new="New · I understand"
        >
          <Checkbox
            id={checkboxId}
            checked={hasUnderstood}
            onCheckedChange={(checked) => onUnderstoodChange(checked === true)}
          />
          <Typography variant="paragraph-small">
            I understand that anything my policies don’t allow will be blocked, even with every signature.
          </Typography>
        </label>

        <PrimaryAction
          label="Get started"
          disabled={!hasUnderstood || !canContinue}
          disabledHint={canContinue ? 'Tick the box to continue.' : 'Pick a Safe account to continue.'}
          onClick={onNext}
        />
      </div>
    </TxCard>
  )
}

export type CheckOutcome = 'allow' | 'allow-without-signatures' | 'block'

const OUTCOMES: Record<CheckOutcome, { label: string; variant: 'success' | 'info' | 'destructive'; Icon: LucideIcon }> =
  {
    allow: { label: 'Allowed', variant: 'success', Icon: Check },
    'allow-without-signatures': { label: 'Allowed, no signatures', variant: 'info', Icon: Zap },
    block: { label: 'Blocked', variant: 'destructive', Icon: X },
  }

/** What policy enforcement does with a transaction: goes through with signatures, goes through without, or never. */
export const OutcomeBadge = ({ outcome }: { outcome: CheckOutcome }): ReactElement => {
  const { label, variant, Icon } = OUTCOMES[outcome]

  return (
    <Badge variant={variant} size="status" shape="status" data-m2-new="New · Outcome badge">
      <Icon aria-hidden />
      {label}
    </Badge>
  )
}

const BASELINE_SUMMARIES: Record<Baseline, string> = {
  'block-all': 'Anything no policy allows is blocked.',
  'allow-all': 'Anything no policy covers stays allowed.',
}

/** The account's general rule from now on; policies are the exceptions to it. */
const BASELINES: { id: Baseline; title: string; description: string; outcome: CheckOutcome; recommended?: boolean }[] =
  [
    {
      id: 'block-all',
      title: 'Block everything else',
      description: 'Only what your policies allow can happen.',
      outcome: 'block',
      recommended: true,
    },
    {
      id: 'allow-all',
      title: 'Allow everything else',
      description: 'Anything your signers approve still goes through.',
      outcome: 'allow',
    },
  ]

/**
 * What it means in practice, which depends on whether the account has policies yet. Without any, blocking leaves
 * only the allowed account changes, and allowing makes the protection do nothing for transactions.
 */
const getBaselineBanner = (baseline: Baseline, hasPolicies: boolean): SetupSummary => {
  if (baseline === 'block-all')
    return hasPolicies
      ? {
          title: 'Only what your policies allow can happen.',
          description: 'Spending limits are blocked too unless a policy allows their tokens and recipients.',
        }
      : {
          title: 'With no policies, nothing can be sent from this account.',
          description: 'Only the account changes you allowed will work. Add a policy in the next step.',
          tone: 'warning',
        }
  return {
    title: 'Protection won’t stop any transaction.',
    description: hasPolicies
      ? 'Everything stays allowed, so it only guards your account settings.'
      : 'With no policies and everything allowed, it only guards your account settings.',
    tone: 'warning',
  }
}

/** Protection on its own: what happens to any transaction no policy covers. */
const BaselineStep = ({ choices, onChoicesChange, onNext }: ChoiceHandlers & { onNext: () => void }): ReactElement => {
  const baseline = choices.baseline ?? 'block-all'

  return (
    <TxCard>
      <div className="flex flex-col gap-5" data-m2-new="New · Everything else step">
        <div className="flex flex-col gap-2">
          <Typography variant="paragraph-small-medium">Anything no policy covers</Typography>
          <div className="grid gap-2 sm:grid-cols-2">
            {BASELINES.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => onChoicesChange({ ...choices, baseline: option.id })}
                aria-pressed={baseline === option.id}
                className={classnames(
                  'flex cursor-pointer flex-col items-start gap-2 rounded-lg border p-3 text-left transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                  baseline === option.id ? 'border-foreground bg-card' : 'border-border hover:bg-muted',
                )}
              >
                <span className="flex flex-col gap-1">
                  <Typography variant="paragraph-small-medium" as="span">
                    {option.title}
                  </Typography>
                  <Typography variant="paragraph-mini" color="muted" as="span">
                    {option.description}
                  </Typography>
                </span>
                <span className="mt-auto flex flex-wrap items-center gap-1.5">
                  <OutcomeBadge outcome={option.outcome} />
                  {option.recommended && (
                    <Badge variant="subtle" shape="tag">
                      Recommended
                    </Badge>
                  )}
                </span>
              </button>
            ))}
          </div>
        </div>

        <PrimaryAction label="Next" onClick={onNext} />
      </div>
    </TxCard>
  )
}

/** The prototype's proposers, as the policy table lists them. */
const ACCOUNT_PROPOSERS: Record<string, string[]> = {
  [getAccountKey(TREASURY)]: ['Tom Reyes'],
  [getAccountKey(TRADING_DESK)]: ['Priya Shah'],
}

/** Where a spending limit can still send under each starting point: it never skips the protection. */
const LIMIT_REACH: Record<Baseline, string> = {
  'block-all': 'Blocked until a policy allows its tokens and recipients.',
  'allow-all': 'Any token, to any address.',
}

/**
 * The last step before Review: the account's policies, now checked by the protection, with a reminder that more can be
 * added later; or, with none yet, the choice to add an allowlist in this same setup.
 */
const PoliciesStep = ({
  account,
  choices,
  onChoicesChange,
  onNext,
}: ChoiceHandlers & { account?: M2Account; onNext: () => void }): ReactElement => {
  const existing = account ? getExistingPermissions(account) : []
  const proposers = account ? (ACCOUNT_PROPOSERS[getAccountKey(account)] ?? []) : []
  const baseline = choices.baseline ?? 'block-all'
  const addAllowlist = choices.addAllowlist ?? true
  const ProposerIcon = POLICY_ICONS.proposer

  return (
    <TxCard>
      <div className="flex flex-col gap-5" data-m2-new="New · Policies step">
        {existing.length + proposers.length > 0 && (
          <div className="flex flex-col gap-2">
            <Typography variant="paragraph-small-medium">Already on this account, checked from now on</Typography>
            {existing.map(({ id, kind, holder, detail, Icon }) => (
              <div key={id} className="flex items-center gap-3 rounded-lg bg-muted px-3 py-2.5">
                <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                <span className="flex min-w-0 flex-1 flex-col">
                  <Typography variant="paragraph-small-medium">
                    {kind} · {holder} · {detail}
                  </Typography>
                  <MutedLine>{LIMIT_REACH[baseline]}</MutedLine>
                </span>
                <OutcomeBadge outcome={baseline === 'block-all' ? 'block' : 'allow-without-signatures'} />
              </div>
            ))}
            {proposers.map((name) => (
              <div key={name} className="flex items-center gap-3 rounded-lg bg-muted px-3 py-2.5">
                <ProposerIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                <span className="flex min-w-0 flex-1 flex-col">
                  <Typography variant="paragraph-small-medium">Proposer role · {name}</Typography>
                  <MutedLine>What they propose still needs signers, then policy enforcement checks it.</MutedLine>
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-2">
          <Typography variant="paragraph-small-medium">Your first allowlist</Typography>
          <div className="grid gap-2 sm:grid-cols-2">
            {[
              {
                value: true,
                title: 'Add it now',
                description: 'Pick the tokens and recipients signers can send to. Part of this same setup.',
                recommended: true,
              },
              {
                value: false,
                title: 'Later',
                description: 'Add policies from Policies once enforcement is on.',
              },
            ].map((option) => (
              <button
                key={option.title}
                type="button"
                onClick={() => onChoicesChange({ ...choices, addAllowlist: option.value })}
                aria-pressed={addAllowlist === option.value}
                className={classnames(
                  'flex cursor-pointer flex-col items-start gap-1 rounded-lg border p-3 text-left transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                  addAllowlist === option.value ? 'border-foreground bg-card' : 'border-border hover:bg-muted',
                )}
              >
                <span className="flex items-center gap-2">
                  <Typography variant="paragraph-small-medium" as="span">
                    {option.title}
                  </Typography>
                  {option.recommended && (
                    <Badge variant="subtle" shape="tag">
                      Recommended
                    </Badge>
                  )}
                </span>
                <Typography variant="paragraph-mini" color="muted" as="span">
                  {option.description}
                </Typography>
              </button>
            ))}
          </div>
        </div>
        <PrimaryAction label={addAllowlist ? 'Set up allowlist' : 'Next'} onClick={onNext} />
      </div>
    </TxCard>
  )
}

/** Each group in one plain line, for the summary most people read and move on from. */
const SETTING_GROUP_SUMMARIES: Record<string, { Icon: LucideIcon; summary: string }> = {
  Signers: { Icon: UsersRound, summary: 'Add, remove or replace signers, and change the threshold.' },
  Policies: { Icon: AccountProtectionIcon, summary: 'Add or remove policies, and change policy enforcement.' },
  Advanced: { Icon: Settings2, summary: 'Batched transactions and how unknown calls are handled.' },
}

/** After Policies, before Review: which changes to the Safe account itself the allowlist still lets through. */
const SettingsStep = ({
  choices,
  onChoicesChange,
  onNext,
  isUnchangedEdit = false,
  hasAccount = true,
}: ChoiceHandlers & {
  onNext: () => void
  /** Started from New, the Safe account is picked on this step; Next waits for it. */
  hasAccount?: boolean
  /** The last step before Review in an edit: Next stays off until something changes, as in M1. */
  isUnchangedEdit?: boolean
}): ReactElement => {
  // A summary first, editing on request: the common pattern for settings most people leave alone.
  const [isCustomizing, setIsCustomizing] = useState(false)

  return (
    <TxCard>
      <div className="flex flex-col gap-5" data-m2-new="New · Safe account settings step">
        {isCustomizing ? (
          <div className="flex flex-col gap-4" data-m2-new="New · Customize account settings">
            <div className="flex items-center justify-between gap-3">
              <MutedLine>Select anything you want to block.</MutedLine>
              <Button variant="outline" size="sm" onClick={() => setIsCustomizing(false)}>
                Done
              </Button>
            </div>
            {ACCOUNT_SETTING_GROUPS.map(({ title, settings }) => (
              <SettingsGroup
                key={title}
                title={title}
                settings={settings}
                choices={choices}
                onChoicesChange={onChoicesChange}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-4 rounded-xl bg-muted p-4" data-m2-new="New · Account settings summary">
            <div className="flex flex-col gap-1">
              <Typography variant="paragraph-bold">Account settings</Typography>
              <MutedLine>Changes to the Safe account itself.</MutedLine>
            </div>
            <ItemList>
              {ACCOUNT_SETTING_GROUPS.map(({ title, settings }) => {
                const { Icon, summary } = SETTING_GROUP_SUMMARIES[title] ?? { Icon: Settings2, summary: '' }
                const blocked = settings.filter(({ id }) => choices.blockedSettings.includes(id)).length

                return (
                  <ItemSurface key={title}>
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-card">
                        <Icon className="size-4 text-muted-foreground" aria-hidden />
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col">
                        <Typography variant="paragraph-small-medium">{title}</Typography>
                        <MutedLine>{summary}</MutedLine>
                      </div>
                      {blocked === settings.length ? (
                        <OutcomeBadge outcome="block" />
                      ) : blocked === 0 ? (
                        <OutcomeBadge outcome="allow" />
                      ) : (
                        <Badge variant="warning" shape="tag">
                          {blocked} blocked
                        </Badge>
                      )}
                    </div>
                  </ItemSurface>
                )
              })}
            </ItemList>
            <Button variant="outline" size="sm" className="self-start" onClick={() => setIsCustomizing(true)}>
              Customize
            </Button>
          </div>
        )}

        <PrimaryAction
          label="Next"
          disabled={isUnchangedEdit || !hasAccount}
          disabledHint={
            hasAccount
              ? 'Nothing has changed yet. Change a token, recipient, policy or account change to continue.'
              : 'Pick a Safe account to continue.'
          }
          onClick={onNext}
        />
      </div>
    </TxCard>
  )
}

// Fake on-chain addresses for the setup multisend. MultiSendCallOnly 1.4.1 is the canonical mainnet deployment.
const MULTI_SEND_CALL_ONLY = '0x9641d764fc13c8B624c04430C7356C1C7C8102e2'

const GUARD_NAME = 'SafePolicyGuard'

/** The guard's policy contracts, one per kind of rule. */
const POLICIES = {
  token: { label: 'Token withdraw allowlist', address: getAddress('0x25dd3c7e8a1b4f9e6d2c5b8a7f0e3d6c9b14d187') },
  native: { label: 'Native transfers', address: getAddress('0x01b7a9e4c2d5f8b3a6e1d0c7f4b9a2e5d8c37246') },
}

/** ERC-20 `transfer(address,uint256)`. */
const TRANSFER_SELECTOR = '0xa9059cbb'
/** A native transfer has no calldata, so its rule matches the empty selector. */
const NATIVE_SELECTOR = '0x00000000'

/** One rule configureImmediately sets: a policy, what it applies to (a token, or a recipient for ETH) and who it allows. */
type PolicyRule = {
  policy: keyof typeof POLICIES
  target: { address: string; name: string; logoUri?: string }
  selector: string
  /** Empty for a native rule, whose target is the recipient itself. */
  recipients: Recipient[]
}

const isNativeToken = ({ symbol }: AccountToken): boolean => symbol === 'ETH'

// The account's own tokens carry no address, so it comes from the popular list.
const getTokenAddress = (token: AccountToken): string | undefined =>
  token.address ?? POPULAR_TOKENS.find(({ symbol }) => symbol === token.symbol)?.address

/** One rule per allowed ERC-20 (all selected recipients), then one per recipient for ETH. */
const getPolicyRules = (choices: SetupChoices, account: M2Account): PolicyRule[] => {
  const recipients = getSelectedRecipients(choices)
  const tokens = getAllowedTokens(choices, account)

  const tokenRules = tokens.flatMap((token): PolicyRule[] => {
    const address = isNativeToken(token) ? undefined : getTokenAddress(token)
    if (!address) return []
    const target = { address, name: token.name, logoUri: token.logoUri }
    return [{ policy: 'token', target, selector: TRANSFER_SELECTOR, recipients }]
  })

  const nativeRules: PolicyRule[] = tokens.some(isNativeToken)
    ? recipients.map(({ name, address }) => ({
        policy: 'native',
        target: { address, name },
        selector: NATIVE_SELECTOR,
        recipients: [],
      }))
    : []

  return [...tokenRules, ...nativeRules]
}

const getSetupAddressInfoIndex = (account: M2Account, rules: PolicyRule[]): Record<string, AddressInfo> => {
  const entries: AddressInfo[] = [
    { value: account.address, name: account.name },
    { value: GUARD_ADDRESS, name: GUARD_NAME },
    { value: POLICIES.token.address, name: POLICIES.token.label },
    { value: POLICIES.native.address, name: POLICIES.native.label },
    ...rules.map(({ target }) => ({ value: target.address, name: target.name, logoUri: target.logoUri })),
    ...rules.flatMap(({ recipients }) => recipients.map(({ address, name }) => ({ value: address, name }))),
  ]
  return Object.fromEntries(entries.map((info) => [info.value, info]))
}

type FakeCall = {
  to: string
  /** Shown before the method on the collapsed action row, as CGW's address name would be. */
  contractName?: string
  signature: string
  method: string
  args: unknown[]
  params: DataDecodedParameter[]
}

const toMultiSendEntry = ({ to, signature, method, args, params }: FakeCall): MultiSend => ({
  operation: 0,
  to,
  value: '0',
  data: new Interface([signature]).encodeFunctionData(method, args),
  dataDecoded: { method, parameters: params },
})

/** MultiSend's packed `transactions` bytes: operation, to, value, data length and data per call. */
const encodeMultiSendTransactions = (entries: MultiSend[]): string =>
  concat(
    entries.map(({ operation, to, value, data }) =>
      solidityPacked(
        ['uint8', 'address', 'uint256', 'uint256', 'bytes'],
        [operation, to, value, dataLength(data ?? '0x'), data ?? '0x'],
      ),
    ),
  )

/** The calls the setup batches, following the Create choices. */
const getSetupCalls = (choices: SetupChoices, mode: WizardMode, account: M2Account): FakeCall[] => {
  const rules = getPolicyRules(choices, account)
  const tuples = rules.map(({ policy, target, selector, recipients }) => [
    POLICIES[policy].address,
    target.address,
    selector,
    recipients.map(({ address }) => address),
  ])

  const configureImmediately: FakeCall = {
    to: GUARD_ADDRESS,
    contractName: GUARD_NAME,
    signature:
      'function configureImmediately((address policy, address target, bytes4 selector, address[] recipients)[] rules)',
    method: 'configureImmediately',
    args: [tuples],
    // CGW may send tuples as a JSON string, which the app's ValueArray parses.
    params: [{ name: 'rules', type: '(address,address,bytes4,address[])[]', value: JSON.stringify(tuples) }],
  }

  // An edit only reconfigures the live guard: it is already set.
  if (mode === 'edit') return [configureImmediately]

  return [
    configureImmediately,
    {
      to: account.address,
      signature: 'function setGuard(address guard)',
      method: 'setGuard',
      args: [GUARD_ADDRESS],
      params: [{ name: 'guard', type: 'address', value: GUARD_ADDRESS }],
    },
  ]
}

type SetupTransactionOptions = {
  choices: SetupChoices
  mode?: WizardMode
  account?: M2Account
  /** False drops the decoded actions, so the app's generic "All actions" renders nothing (see ReviewStep). */
  withDecodedActions?: boolean
}

/** Stands in for what M1's review gets from the SDK and CGW: one MultiSendCallOnly delegatecall and its preview. */
const buildSetupTransaction = ({
  choices,
  mode = 'create',
  account = PAYMENTS,
  withDecodedActions = true,
}: SetupTransactionOptions): { safeTx: SafeTransaction; txPreview: TransactionPreview } => {
  const entries = getSetupCalls(choices, mode, account).map(toMultiSendEntry)
  const transactions = encodeMultiSendTransactions(entries)
  const hexData = new Interface(['function multiSend(bytes transactions)']).encodeFunctionData('multiSend', [
    transactions,
  ])

  const safeTx = new EthSafeTransaction({
    to: MULTI_SEND_CALL_ONLY,
    value: '0',
    data: hexData,
    operation: OperationType.DelegateCall,
    safeTxGas: '0',
    baseGas: '0',
    gasPrice: '0',
    gasToken: ZERO_ADDRESS,
    refundReceiver: ZERO_ADDRESS,
    nonce: 12,
  })

  const txPreview: TransactionPreview = {
    txInfo: {
      type: 'Custom',
      to: { value: MULTI_SEND_CALL_ONLY, name: 'Safe: MultiSendCallOnly 1.4.1' },
      dataSize: String((hexData.length - 2) / 2),
      value: '0',
      isCancellation: false,
      methodName: 'multiSend',
      actionCount: entries.length,
    },
    txData: {
      hexData,
      dataDecoded: {
        method: 'multiSend',
        parameters: [
          {
            name: 'transactions',
            type: 'bytes',
            value: transactions,
            valueDecoded: withDecodedActions ? entries : null,
          },
        ],
      },
      to: { value: MULTI_SEND_CALL_ONLY, name: 'Safe: MultiSendCallOnly 1.4.1' },
      value: '0',
      operation: 1,
      trustedDelegateCallTarget: true,
      addressInfoIndex: getSetupAddressInfoIndex(account, getPolicyRules(choices, account)),
    },
  }

  return { safeTx, txPreview }
}

const SETUP_NONCE = 12

/** TxFlow's provider stack minus the SDK, which the story mocks as `{}`: SafeTxContext holds the fake transaction. */
const MockFlowProviders = ({
  step,
  safeTx,
  choices,
  onNext,
  onPrev,
  children,
}: {
  step: number
  safeTx?: SafeTransaction
  choices: SetupChoices
  onNext: () => void
  onPrev: () => void
  children: ReactNode
}): ReactElement => {
  const [txOrigin, setTxOrigin] = useState<string>()
  const [nonceNeeded, setNonceNeeded] = useState(true)

  const safeTxContext = useMemo<SafeTxContextParams>(
    () => ({
      safeTx,
      setSafeTx: () => {},
      setSafeMessage: () => {},
      setSafeMessageHash: () => {},
      setSafeTxError: () => {},
      nonce: SETUP_NONCE,
      setNonce: () => {},
      nonceNeeded,
      setNonceNeeded,
      recommendedNonce: SETUP_NONCE,
      setSafeTxGas: () => {},
      txOrigin,
      setTxOrigin,
      isReadOnly: false,
      gtfPaymentMode: 'safe',
      setGtfPaymentMode: () => {},
      setGtfSelectedGasToken: () => {},
    }),
    [safeTx, txOrigin, nonceNeeded],
  )

  return (
    <SafeTxContext.Provider value={safeTxContext}>
      <TxInfoProvider>
        <SafeShieldProvider>
          <SlotProvider>
            <TxFlowProvider step={step} data={choices} nextStep={onNext} prevStep={onPrev}>
              {children}
            </TxFlowProvider>
          </SlotProvider>
        </SafeShieldProvider>
      </TxInfoProvider>
    </SafeTxContext.Provider>
  )
}

/** How long Safe Shield scans a setup the first time Review shows it. */
const SHIELD_SCAN_MS = 1500

/** What Blockaid's threat analysis returns for the setup: nothing found. */
const SETUP_THREAT: ThreatAnalysisResults = {
  THREAT: [
    {
      severity: Severity.OK,
      type: ThreatStatus.NO_THREAT,
      title: 'No threat detected',
      description: 'Threat analysis found no issues.',
    },
  ],
}

/** What CGW's counterparty analysis returns for the setup: the guard it installs is verified. */
const SETUP_CONTRACT: ContractAnalysisResults = {
  [GUARD_ADDRESS]: {
    name: GUARD_NAME,
    [StatusGroup.CONTRACT_VERIFICATION]: [
      {
        severity: Severity.OK,
        type: ContractStatus.VERIFIED,
        title: 'Verified contract',
        description: `This contract is verified as "${GUARD_NAME}".`,
      },
    ],
  },
}

const SIMULATED: SimulationStatus = {
  isLoading: false,
  isFinished: true,
  isSuccess: true,
  isCallTraceError: false,
  isError: false,
}

type SimulationRequest = ContextType<typeof TxInfoContext>['simulation']

// The panel reads only `status` and the link; a SUCCESS request would need a full Tenderly response.
const simulationRequest = (simulationLink: string): SimulationRequest => ({
  _simulationRequestStatus: FETCH_STATUS.NOT_ASKED,
  simulationData: undefined,
  simulateTransaction: () => {},
  simulationLink,
  resetSimulation: () => {},
})

/** A successful Tenderly run of the setup, for the panel's "Simulation successful" row and its View link. */
const SETUP_SIMULATION: ContextType<typeof TxInfoContext> = {
  simulation: simulationRequest(getSimulationLink('policies-m2-setup')),
  status: SIMULATED,
  nestedTx: { simulation: simulationRequest(''), status: SIMULATED },
}

const IDLE: AsyncResult<never> = [undefined, undefined, false]
const SCANNING: AsyncResult<never> = [undefined, undefined, true]

/** SafeShieldDisplay fed the setup's analysis: SafeShieldWidget's provider hooks never settle in the story. */
const SetupSafeShield = ({ step, safeTx }: { step: number; safeTx?: SafeTransaction }): ReactElement => {
  const txKey = safeTx ? JSON.stringify(safeTx.data) : undefined
  const [scannedKey, setScannedKey] = useState<string>()
  const isScanning = step === REVIEW_STEP && txKey !== undefined && txKey !== scannedKey

  useEffect(() => {
    if (!txKey || txKey === scannedKey) return
    if (step !== REVIEW_STEP) {
      setScannedKey(txKey)
      return
    }
    const timer = setTimeout(() => setScannedKey(txKey), SHIELD_SCAN_MS)
    return () => clearTimeout(timer)
  }, [step, txKey, scannedKey])

  const isScanned = Boolean(safeTx) && !isScanning

  return (
    <TxInfoContext.Provider value={SETUP_SIMULATION}>
      <SafeShieldDisplay
        recipient={IDLE}
        contract={isScanning ? SCANNING : isScanned ? [SETUP_CONTRACT, undefined, false] : IDLE}
        threat={isScanning ? SCANNING : isScanned ? [SETUP_THREAT, undefined, false] : IDLE}
        deadlock={IDLE}
        safeTx={safeTx}
        showHypernativeInfo={false}
        showHypernativeActiveStatus={false}
        safeAnalysis={null}
        hasProFeatures
        isSafePro
      />
    </TxInfoContext.Provider>
  )
}

/** The setup the flow last showed, so the preview handler follows the current choices; kept in sync by SetUpPoliciesFlow. */
const latestSetup: Required<Omit<SetupTransactionOptions, 'withDecodedActions'>> = {
  choices: DEFAULT_CHOICES,
  mode: 'create',
  account: PAYMENTS,
}

/** The decoded preview CGW would return for the fake setup multisend, served to the receipt's own preview request. */
export const SETUP_PREVIEW_HANDLERS = [
  http.post(/\/v1\/chains\/\d+\/transactions\/0x[a-fA-F0-9]+\/preview$/, () =>
    HttpResponse.json(buildSetupTransaction(latestSetup).txPreview),
  ),
]

/** The app's action row (SingleTxDecoded, grouped variant), with the expanded content passed in. */
const SetupActionRow = ({
  index,
  call,
  expanded,
  onExpandedChange,
  children,
}: {
  index: number
  call: FakeCall
  expanded: boolean
  onExpandedChange: (expanded: boolean) => void
  children: ReactNode
}): ReactElement => (
  <Accordion
    data-testid="action-accordion"
    value={expanded ? ['action'] : []}
    onValueChange={(value: string[]) => onExpandedChange(value.includes('action'))}
  >
    <AccordionItem value="action" className="border-0">
      <AccordionTrigger
        data-testid="action-item"
        nativeButton={false}
        render={<div />}
        className={classnames(
          'flex min-h-12 items-center px-4 py-3',
          singleTxCss.groupedTrigger,
          expanded && singleTxCss.groupedTriggerOpen,
        )}
      >
        <div className={singleTxCss.summary}>
          <Code className="size-4 shrink-0 text-muted-foreground" />
          <span className={singleTxCss.summaryIndex}>{index + 1}</span>
          <Typography className={singleTxCss.summaryLabel}>
            {call.contractName ? `${call.contractName}: ` : ''}
            <b>{call.method}</b>
          </Typography>
        </div>
      </AccordionTrigger>

      <AccordionContent className="border-t border-border bg-card p-4">
        <div className="flex flex-col gap-2">{children}</div>
      </AccordionContent>
    </AccordionItem>
  </Accordion>
)

/** A token or recipient as the app's decoded address params show it: identicon, name, full address, explorer. */
const RuleAddress = ({ address, name, logoUri }: PolicyRule['target']): ReactElement | null =>
  generateDataRowValue(address, 'address', true, { value: address, name, logoUri })

const PolicyRuleRows = ({ rule, index, count }: { rule: PolicyRule; index: number; count: number }): ReactElement => {
  const policy = POLICIES[rule.policy]

  return (
    <div className="flex flex-col gap-1.5">
      <Typography variant="paragraph-small-bold" as="div">
        Rule {index + 1} of {count}
      </Typography>

      <TxDataRow title="Policy">
        <Typography variant="paragraph-small" as="div" className="flex flex-wrap items-center gap-2">
          {policy.label}
          <span className="text-muted-foreground">{shortenAddress(policy.address)}</span>
        </Typography>
      </TxDataRow>

      <TxDataRow title="Applies to">
        <div className="flex flex-col gap-0.5">
          <RuleAddress {...rule.target} />
          {/* Indented to the address text, past the 20px identicon and its gap. */}
          <Typography variant="paragraph-small" color="muted" as="div" className="pl-7">
            <HexEncodedData hexData={rule.selector} highlightFirstBytes={false} />
          </Typography>
        </div>
      </TxDataRow>

      {rule.policy === 'token' && (
        <TxDataRow title="Allowed recipients">
          <div className="flex flex-col gap-1">
            {rule.recipients.map(({ address, name }) => (
              <RuleAddress key={address} address={address} name={name} />
            ))}
          </div>
        </TxDataRow>
      )}
    </div>
  )
}

/** The app's Multisend rebuilt so configureImmediately lists "Rule N of M", which the generic decoder can't. */
const SetupActions = ({
  choices,
  mode,
  account,
}: {
  choices: SetupChoices
  mode: WizardMode
  account: M2Account
}): ReactElement => {
  const [openMap, setOpenMap] = useState<Record<number, boolean>>()
  const rules = useMemo(() => getPolicyRules(choices, account), [choices, account])
  const calls = useMemo(() => getSetupCalls(choices, mode, account), [choices, mode, account])
  const addressInfoIndex = useMemo(() => getSetupAddressInfoIndex(account, rules), [account, rules])

  return (
    <>
      <MultisendActionsHeader setOpen={setOpenMap} amount={calls.length} compact />

      <Card variant="muted" size="none" data-m2-new="M1 copy · All actions (rule by rule)">
        <CardContent>
          <div className="p-2">
            <div className="flex flex-col divide-y divide-border overflow-hidden rounded-sm">
              {calls.map((call, index) => {
                const entry = toMultiSendEntry(call)

                return (
                  <SetupActionRow
                    key={call.method}
                    index={index}
                    call={call}
                    expanded={openMap?.[index] ?? false}
                    onExpandedChange={(expanded) => setOpenMap((prev) => ({ ...prev, [index]: expanded }))}
                  >
                    {call.method === 'configureImmediately' ? (
                      <div className="flex flex-col gap-4">
                        <MethodCall contractAddress={call.to} contractName={call.contractName} method={call.method} />
                        {rules.map((rule, ruleIndex) => (
                          <PolicyRuleRows
                            key={`${rule.policy}-${rule.target.address}`}
                            rule={rule}
                            index={ruleIndex}
                            count={rules.length}
                          />
                        ))}
                      </div>
                    ) : (
                      <DecodedData
                        txData={{
                          to: { value: entry.to },
                          value: entry.value,
                          operation: entry.operation,
                          dataDecoded: entry.dataDecoded,
                          hexData: entry.data ?? undefined,
                          addressInfoIndex,
                          trustedDelegateCallTarget: false,
                        }}
                        toInfo={{ value: entry.to }}
                      />
                    )}
                  </SetupActionRow>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  )
}

/** ReviewTransactionContent fed the fake preview; the error boundary is there because hash rows call the mocked SDK. */
const PolicyReviewContent = ({
  txPreview,
  onSubmit,
  children,
}: {
  txPreview: TransactionPreview
  onSubmit: () => void
  children: ReactNode
}): ReactElement => {
  const { safeTx } = useContext(SafeTxContext)
  const safeShield = useSafeShield()
  const txFlow = useContext(TxFlowContext)

  // With no real gas estimate or Safe Shield verdict, these flags would keep Continue disabled forever.
  const unblockedTxFlow = useMemo(() => ({ ...txFlow, isSubmitDisabled: false, isSubmitLoading: false }), [txFlow])
  const unblockedSafeShield = useMemo(() => ({ ...safeShield, needsRiskConfirmation: false }), [safeShield])

  return (
    <ObservabilityErrorBoundary
      fallback={<MutedLine>The transaction review could not render with mock data.</MutedLine>}
    >
      <TxFlowContext.Provider value={unblockedTxFlow}>
        <ReviewTransactionContent
          safeTx={safeTx}
          safeTxError={undefined}
          safeShield={unblockedSafeShield}
          txPreview={txPreview}
          onSubmit={onSubmit}
        >
          {children}
        </ReviewTransactionContent>
      </TxFlowContext.Provider>
    </ObservabilityErrorBoundary>
  )
}

const ReviewStep = ({
  account,
  choices,
  viewer,
  onNext,
  mode,
  initialChoices,
  protectionOnly,
  isSinglePolicy,
}: {
  account: M2Account
  choices: SetupChoices
  viewer: SignerId
  onNext: () => void
  mode: WizardMode
  initialChoices?: SetupChoices
  protectionOnly?: boolean
  isSinglePolicy?: boolean
}): ReactElement => {
  // Without decoded actions the app's Multisend renders nothing, so SetupActions takes its place below.
  const { txPreview } = useMemo(
    () => buildSetupTransaction({ choices, mode, account, withDecodedActions: false }),
    [choices, mode, account],
  )

  return (
    <PolicyReviewContent txPreview={txPreview} onSubmit={onNext}>
      <PolicySummary
        choices={choices}
        account={account}
        initialChoices={initialChoices}
        protectionOnly={protectionOnly}
        isSinglePolicy={isSinglePolicy}
      />

      <MutedLine>
        {otherSignerNames(viewer)} will be asked to sign next. Nothing changes until it&apos;s executed.
      </MutedLine>

      {/* The same slot registrars TxFlow hands M1's review: they render into ReviewTransactionContent's Main slot. */}
      <BalanceChanges />
      <FeesPreview />
      <TxNote />

      {/* Last child, so it sits right before ConfirmationView, where the app's "All actions" renders. */}
      <SetupActions choices={choices} mode={mode} account={account} />
    </PolicyReviewContent>
  )
}

/** ConfirmTxReceipt's three numbered steps, copy verbatim. */
const SIGN_STEPS: { label: string; description: ReactNode }[] = [
  {
    label: 'Review what you will sign',
    description: (
      <>
        Signing is an irreversible action so make sure you know what you are signing.{' '}
        <ExternalLink href="https://help.safe.global/articles/2485383995-How-to-perform-basic-transactions-checks-on-Safe{Wallet}">
          Read more
        </ExternalLink>
        .
      </>
    ),
  },
  {
    label: 'Compare with your wallet',
    description: (
      <>
        Once you click <b>Sign</b>, the transaction will appear in your signing wallet. Make sure that all the details
        match.
      </>
    ),
  },
  {
    label: 'Verify with external tools',
    description: (
      <>
        You can additionally cross-verify your transaction data in a third-party tool like{' '}
        <ExternalLink href="https://safeutils.openzeppelin.com/">Safe Utils</ExternalLink>.
      </>
    ),
  },
]

const ReceiptRow = ({ label, children }: { label: string; children: ReactNode }): ReactElement => (
  <div className="flex items-start justify-between gap-4 py-3">
    <Typography variant="paragraph-small" color="muted" className="shrink-0">
      {label}
    </Typography>
    <div className="min-w-0 text-right">{children}</div>
  </div>
)

const ReceiptRows = ({ rows }: { rows: { label: string; value: ReactNode }[] }): ReactElement => (
  <div className="flex flex-col">
    {rows.map(({ label, value }, index) => (
      <div key={label}>
        {index > 0 && <Separator />}
        <ReceiptRow label={label}>{value}</ReceiptRow>
      </div>
    ))}
  </div>
)

const HexValue = ({ value }: { value: string }): ReactElement => {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="flex flex-col items-start gap-1 text-left">
      <Typography variant="code" className={classnames('break-all text-xs', !isExpanded && 'line-clamp-5')}>
        {value}
      </Typography>
      <Button variant="ghost-muted" size="xs" className="-ml-4" onClick={() => setIsExpanded((expanded) => !expanded)}>
        {isExpanded ? 'Show less' : 'Show more'}
      </Button>
    </div>
  )
}

const FAKE_HASHES = {
  domainHash: '0x1d4f6b2e9a3c5e7f8091a2b3c4d5e6f708192a3b4c5d6e7f8091a2b3c4d5e6f7',
  messageHash: '0x7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b',
  safeTxHash: '0x3c5e7f8091a2b3c4d5e6f708192a3b4c5d6e7f8091a2b3c4d5e6f708192a3b4c',
}

/** The receipt's right-hand panel: Data / Hashes / JSON tabs over the setup multisend. */
const ReceiptPanel = ({ safeTx }: { safeTx: SafeTransaction }): ReactElement => {
  const { data } = safeTx

  return (
    <Card variant="muted" size="none" radius="lg">
      <Tabs defaultValue="data" className="p-4">
        <TabsList variant="toggle" className="self-end">
          <TabsTrigger value="data">Data</TabsTrigger>
          <TabsTrigger value="hashes">Hashes</TabsTrigger>
          <TabsTrigger value="json">JSON</TabsTrigger>
        </TabsList>

        <TabsContent value="data">
          <ReceiptRows
            rows={[
              {
                label: 'To',
                value: <SafeAddress name="Safe: MultiSendCallOnly 1.4.1" address={data.to} />,
              },
              { label: 'Value', value: data.value },
              { label: 'Data', value: <HexValue value={data.data} /> },
              { label: 'Operation', value: '1 (delegate call)' },
              { label: 'SafeTxGas', value: data.safeTxGas },
              { label: 'BaseGas', value: data.baseGas },
              { label: 'GasPrice', value: data.gasPrice },
              { label: 'GasToken', value: <SafeAddress address={data.gasToken} avatarSize={20} /> },
              { label: 'RefundReceiver', value: <SafeAddress address={data.refundReceiver} avatarSize={20} /> },
              { label: 'Nonce', value: String(data.nonce) },
            ]}
          />
        </TabsContent>

        <TabsContent value="hashes">
          <ReceiptRows
            rows={[
              { label: 'Domain hash', value: <HexValue value={FAKE_HASHES.domainHash} /> },
              { label: 'Message hash', value: <HexValue value={FAKE_HASHES.messageHash} /> },
              { label: 'safeTxHash', value: <HexValue value={FAKE_HASHES.safeTxHash} /> },
            ]}
          />
        </TabsContent>

        <TabsContent value="json">
          <Typography variant="code" className="block whitespace-pre-wrap break-all text-xs">
            {JSON.stringify(data, null, 2)}
          </Typography>
        </TabsContent>
      </Tabs>
    </Card>
  )
}

/** The "Estimated fee" block from the live app's receipt: who pays gas, with the sponsored quota. */
const EstimatedFee = (): ReactElement => {
  const [payer, setPayer] = useState('sponsored')

  return (
    <Card variant="outlined" size="none" radius="lg" data-m2-new="M1 copy · Estimated fee">
      <div className="flex items-center justify-between p-4">
        <Typography variant="paragraph-small-bold">Estimated fee</Typography>
        <span className="flex items-center gap-1">
          <Typography variant="paragraph-small-bold">Free</Typography>
          <ChevronDown className="size-4" aria-hidden />
        </span>
      </div>

      <Separator />

      <div className="flex flex-col gap-4 p-4">
        <MutedLine>Who will pay gas fees</MutedLine>
        <RadioGroup value={payer} onValueChange={(value) => setPayer(String(value))} className="grid grid-cols-2 gap-4">
          <Field orientation="horizontal">
            <RadioGroupItem id="gas-sponsored" value="sponsored" />
            <FieldLabel htmlFor="gas-sponsored">Sponsored by Safe</FieldLabel>
          </Field>
          <Field orientation="horizontal">
            <RadioGroupItem id="gas-wallet" value="wallet" />
            <FieldLabel htmlFor="gas-wallet">Connected wallet</FieldLabel>
          </Field>
        </RadioGroup>
      </div>

      <div className="flex items-center justify-between gap-2 bg-muted px-4 py-3">
        <MutedLine>
          <span className="font-semibold text-foreground">50</span>/50 sponsored transactions left · Resets Nov 6, 10:45
          UTC
        </MutedLine>
        <Badge variant="brand">PRO</Badge>
      </div>
    </Card>
  )
}

/** ConfirmTxReceipt's "Review details" recreated statically: the real one needs the SDK and a CGW preview. */
const ReceiptStep = ({
  action,
  safeTx,
  onSubmit,
}: {
  action: 'sign' | 'execute'
  safeTx: SafeTransaction
  onSubmit?: () => void
}): ReactElement => (
  <TxCard>
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2" data-m2-new="M1 copy · Review details receipt">
      <div className="flex flex-col gap-6 px-1">
        {SIGN_STEPS.map(({ label, description }, index) => (
          <div key={label} className="flex flex-row gap-4">
            <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
              {index + 1}
            </div>
            <div className="flex flex-col gap-2">
              <Typography className="font-bold">{label}</Typography>
              <Typography>{description}</Typography>
            </div>
          </div>
        ))}
      </div>

      <ReceiptPanel safeTx={safeTx} />
    </div>

    <EstimatedFee />

    <PrimaryAction label={action === 'sign' ? 'Sign' : 'Execute'} onClick={onSubmit} />
  </TxCard>
)

const describeTokens = (tokens: AccountToken[]): string =>
  tokens.length > 3 ? `${tokens.length} tokens` : joinList(tokens.map(({ symbol }) => symbol))

const describeRecipients = (recipients: Recipient[]): string =>
  recipients.length === 1 ? recipients[0].name : `${recipients.length} recipients`

/** The choices so far as one sentence, rebuilt on every change and shown on every step. */
type SetupSummary = {
  title: string
  description?: string
  /** Behind the info icon at the end of the description. */
  details?: string
  /** Yellow when the choice leaves funds exposed; blue otherwise. */
  tone?: 'info' | 'warning'
}

const useSetupSummary = (
  account: M2Account | undefined,
  choices: SetupChoices,
  /** The step the banner sits on: its title and line are that step's own. */
  step: number,
  isEditMode: boolean,
  /** Edit reached from Create by picking an account that already has an allowlist. */
  isExistingFromCreate = false,
  /** The protection flow: no allowlist or spending limits steps. */
  protectionOnly = false,
  /** Changing a live protection's rules: it waits 24 hours once executed. */
  protectionEdit = false,
  /** A single policy: it only checks its own area, so everything else stays allowed. */
  isSinglePolicy = false,
): SetupSummary => {
  const chain = useChain(account?.chainId ?? '')
  const tokens = getAllowedTokens(choices, account)
  const recipients = getShownRecipients(choices, account).filter(({ selected }) => selected)

  const who = account ? `${account.name}${chain ? ` on ${chain.chainName}` : ''}` : undefined
  const isComplete = tokens.length > 0 && recipients.length > 0
  const otherSigners = Math.max((account?.threshold ?? 1) - 1, 0)

  const allowedRule =
    isComplete && who
      ? `${who} will only be able to send ${describeTokens(tokens)} to ${describeRecipients(recipients)}.`
      : `Pick which tokens ${who} can send and who can receive them.`
  const existingPermissions = account ? getExistingPermissions(account) : []
  const allowedSettingCount = getAllowedSettings(choices).length
  // Each step's own title and line; the timing sits behind the ⓘ on every step.
  const STEP_BANNERS: Record<number, SetupSummary> = {
    // The intro hides the banner; this only fills the compact header if it ever shows.
    [INTRO_STEP]: {
      title: `Enforce policies on ${who}.`,
      description: protectionOnly
        ? 'Choose what to block on the account.'
        : 'Choose what to block on the account, then set up your allowlist.',
    },
    [BASELINE_STEP]: getBaselineBanner(choices.baseline ?? 'block-all', existingPermissions.length > 0),
    [POLICIES_STEP]:
      (choices.addAllowlist ?? true)
        ? { title: 'Add an allowlist in this same setup.', description: 'One transaction turns on both.' }
        : (choices.baseline ?? 'block-all') === 'block-all'
          ? {
              title:
                existingPermissions.length > 0
                  ? 'Your spending limits will be blocked until you add an allowlist.'
                  : 'Nothing can be sent until you add a policy.',
              description: 'Only the account changes you allowed will work until then.',
              tone: 'warning',
            }
          : {
              title: 'Protection won’t stop any transaction yet.',
              description: 'Add policies later and block everything else to make it count.',
              tone: 'warning',
            },
    [CREATE_STEP]: isEditMode
      ? {
          title: isExistingFromCreate
            ? `${who} already has an allowlist, so you're editing it.`
            : `You're editing the allowlist on ${who}.`,
          description: 'Anything you deselect will be blocked once the change applies.',
        }
      : {
          title: allowedRule,
          description: isSinglePolicy
            ? 'This policy only applies to sending tokens.'
            : 'Anything you leave out will be blocked.',
        },
    // Nothing selected locks the Safe account, so it turns yellow and says what that means.
    [SETTINGS_STEP]:
      allowedSettingCount === 0
        ? {
            title: 'No account changes will be allowed.',
            description:
              "You won't be able to change signers, the threshold or policies, including policy enforcement itself.",
            tone: 'warning',
          }
        : {
            title:
              allowedSettingCount === ALL_ACCOUNT_SETTINGS.length
                ? 'All account changes stay allowed.'
                : `${allowedSettingCount} of ${ALL_ACCOUNT_SETTINGS.length} account changes stay allowed.`,
            description:
              allowedSettingCount === ALL_ACCOUNT_SETTINGS.length
                ? 'Block a change only if no one should ever make it. Blocked changes can’t be made, even with every signature.'
                : 'Blocked changes can’t be made, even with every signature.',
          },
    // Spending limits left out turn it yellow; in edit mode it points at the Added/Removed marks instead.
    [REVIEW_STEP]: protectionEdit
      ? {
          title: `You're changing policy enforcement on ${who}.`,
          description: `${BASELINE_SUMMARIES[choices.baseline ?? 'block-all']} It applies 24 hours after it's executed.`,
        }
      : protectionOnly
        ? {
            title: `Policies will be enforced on ${who}.`,
            description: [
              BASELINE_SUMMARIES[choices.baseline ?? 'block-all'],
              allowedSettingCount === ALL_ACCOUNT_SETTINGS.length
                ? 'All account changes stay allowed.'
                : `${allowedSettingCount} of ${ALL_ACCOUNT_SETTINGS.length} account changes stay allowed.`,
            ].join(' '),
          }
        : isEditMode
          ? {
              title: allowedRule,
              description:
                'Check the details below before you sign. This starts a 24-hour wait, and a second transaction will be needed to apply the changes to the policy.',
            }
          : isSinglePolicy
            ? { title: allowedRule, description: 'This policy only applies to sending tokens.' }
            : // The whole setup in one place: the allowlist and the account settings.
              {
                title: allowedRule,
                description:
                  allowedSettingCount === ALL_ACCOUNT_SETTINGS.length
                    ? 'All account changes stay allowed.'
                    : `${allowedSettingCount} of ${ALL_ACCOUNT_SETTINGS.length} account changes stay allowed.`,
              },
    [CONFIRM_STEP]: {
      title: isEditMode ? 'Sign to add the change to the queue.' : 'Sign to queue policy enforcement.',
      description:
        otherSigners > 0
          ? `${otherSigners} more ${otherSigners === 1 ? 'signer needs' : 'signers need'} to confirm before it can be executed.`
          : 'Your signature is the only one needed. It can be executed right after.',
    },
    [EXECUTE_STEP]:
      isEditMode || protectionEdit
        ? {
            title: 'Execute to start the 24-hour wait.',
            description: 'After that, a second transaction will be needed to apply the changes to the policy.',
          }
        : { title: 'Execute to turn on policy enforcement.', description: 'It applies right away.' },
  }
  const banner: SetupSummary = who
    ? STEP_BANNERS[step]
    : {
        title: 'Pick a Safe account.',
        description: 'Then choose what it can do.',
      }

  // The timing is always in the ⓘ; a step can put its own detail first, e.g. the risk when spending limits are left out.
  // Execute's own line already says it applies right away, so its ⓘ keeps only the 24-hour note.
  // Create applies right away, an edit after 24 hours; Execute's own line already says the first half.
  const timing = !who
    ? undefined
    : isEditMode
      ? 'Any signer can cancel the change before it applies.'
      : step === EXECUTE_STEP
        ? 'Further changes will take 24 hours to apply.'
        : 'These changes take effect as soon as this transaction is executed. Further changes will take 24 hours to apply.'
  const details = [banner.details, timing].filter(Boolean).join(' ') || undefined

  return { ...banner, details }
}

/** The summary's title with its ⓘ: the timing and what gets blocked, behind a tooltip. */
/** The ⓘ with the timing; it follows the banner's last line of text. */
const SummaryInfo = ({ details }: { details?: string }): ReactElement | null =>
  details ? (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            aria-label="When this takes effect"
            className="ml-1 inline-flex cursor-pointer align-[-2px] text-muted-foreground hover:text-foreground"
          />
        }
      >
        <Info className="size-3.5" aria-hidden />
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">{details}</TooltipContent>
    </Tooltip>
  ) : null

/** The summary as a banner: title, the step's line, and the ⓘ after whichever line comes last. */
const SummaryAlert = ({ title, description, details, tone = 'info' }: SetupSummary): ReactElement => (
  <M2Alert
    tone={tone}
    title={
      <>
        {title}
        {!description && <SummaryInfo details={details} />}
      </>
    }
    description={
      description && (
        <>
          {description}
          <SummaryInfo details={details} />
        </>
      )
    }
  />
)

const SetupSentence = (summary: SetupSummary): ReactElement => (
  <div className="px-[var(--space-3)] pt-[var(--space-2)]" aria-live="polite" data-m2-new="New · Summary banner">
    <SummaryAlert {...summary} />
  </div>
)

/** The account a compact header names: identicon, name and network on one line. */
const CompactAccount = ({ account }: { account: M2Account }): ReactElement => {
  const chain = useChain(account.chainId)

  return (
    <div className="flex min-w-0 items-center gap-2 rounded-md border border-border px-2 py-1">
      <Identicon address={account.address} size={20} />
      <Typography variant="paragraph-small-medium" className="truncate">
        {account.name}
      </Typography>
      {chain && (
        <Typography variant="paragraph-small" color="muted" className="shrink-0">
          on {chain.chainName}
        </Typography>
      )}
    </div>
  )
}

/** A fixed title row, so everything pinned below it knows where the title ends. */
const TITLE_ROW_HEIGHT = 'h-12'
// The pinned title's 10px top padding, its row and its --space-2 bottom padding.
const PINNED_TITLE_TOP = 'top-[calc(10px+3rem+var(--space-2))]'
// The side frames start level with the card and pin there, beside the compact header.
const SIDE_FRAME_OFFSET =
  'min-[900px]:sticky min-[900px]:top-[calc(10px+3rem+var(--space-2))] min-[900px]:mt-[calc(10px+3rem+var(--space-2))]'

/**
 * Pinned under the title once the full header scrolls away: the compact tile as its own frame, a page-coloured gap,
 * then a white rounded edge the content scrolls out from, so it reads as a second frame. Hidden, not unmounted, so it can fade.
 */
const CompactHeader = ({
  account,
  summary,
  isVisible,
  mode,
  step,
}: {
  mode: WizardMode
  step: number
  account?: M2Account
  /** The same title, line and ⓘ as the full banner. */
  summary: SetupSummary
  isVisible: boolean
}): ReactElement => (
  <div className={classnames('sticky z-10 h-0', PINNED_TITLE_TOP)}>
    <div
      aria-hidden={!isVisible}
      className={classnames(
        'absolute inset-x-0 top-0 transition-opacity duration-200',
        isVisible ? 'opacity-100' : 'pointer-events-none opacity-0',
      )}
    >
      <div className="bg-[var(--color-background-main)] [[data-theme=dark]_&]:bg-background">
        <CompactHeaderTile account={account} summary={summary} mode={mode} step={step} />
        <div aria-hidden className="mt-4 h-4 rounded-t-xl bg-card" />
      </div>
      {/* A short white fade inside the frame's edge, so the content slides out from under it softly. */}
      <div aria-hidden className="h-6 bg-linear-to-b from-card via-card/40 via-40% to-transparent" />
    </div>
  </div>
)

/** The policy, account and summary in one small frame. */
const CompactHeaderTile = ({
  account,
  summary,
  mode,
  step,
}: {
  account?: M2Account
  summary: SetupSummary
  mode: WizardMode
  step: number
}): ReactElement => {
  const Icon = isAllowlistHeader(mode, step) ? ShieldIcon : ProtectionIcon

  return (
    <div className="flex shrink-0 flex-col gap-3 rounded-xl bg-card p-4" data-m2-new="New · Compact header">
      <div className="flex items-center gap-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-md border border-border [&_svg]:size-4">
          <Icon />
        </span>
        <Typography variant="paragraph-small-medium">
          <FlowSubtitle mode={mode} step={step} />
        </Typography>
        <div className="ml-auto min-w-0">
          {account ? (
            <CompactAccount account={account} />
          ) : (
            <Typography variant="paragraph-small" color="muted">
              No Safe account picked yet
            </Typography>
          )}
        </div>
      </div>
      <SummaryAlert {...summary} />
    </div>
  )
}

/** The card header's name, where M1 has "Spending limit": the allowlist on its own step and in an edit, else the setup. */
const isAllowlistHeader = (mode: WizardMode, step: number): boolean => mode === 'edit' || step === CREATE_STEP

/** The allowlist's own steps say "Allowlist"; the protection's say which step it is, since the page title names it. */
const FlowSubtitle = ({ mode, step }: { mode: WizardMode; step: number }): ReactElement => (
  <span>
    {CARD_HEADINGS[mode === 'create' ? step : -1] ??
      (isAllowlistHeader(mode, step) ? 'Allowlist' : WIZARD_STEP_NAMES[step])}
  </span>
)

/** The two setup steps say what they decide; the stepper keeps their short names. */
const CARD_HEADINGS: Record<number, string> = {
  [SETTINGS_STEP]: 'Choose which account changes to allow',
  [CREATE_STEP]: 'Choose which tokens can be sent, and to whom',
}

/** The allowlist's icon, as in the policy table and side panel. */
const ShieldIcon = (): ReactElement => <Users aria-hidden />

/** Policy enforcement's icon, as on the protection row in the table. */
const ProtectionIcon = (): ReactElement => <AccountProtectionIcon aria-hidden />

const StepLabel = ({ children }: { children: ReactNode }): ReactElement => (
  <span className="truncate text-sm leading-5 group-enabled:group-hover:underline">{children}</span>
)

/** A check once the step is done, a plus for the current and later steps; later steps are greyed. */
const StepIcon = ({ isDone, isUpcoming }: { isDone: boolean; isUpcoming: boolean }): ReactElement => {
  const Icon = isDone ? Check : Plus

  return (
    <span
      className={classnames(
        'flex size-5 shrink-0 items-center justify-center rounded-full text-card',
        isUpcoming ? 'bg-muted-foreground/50' : 'bg-foreground',
      )}
    >
      <Icon className="size-3" strokeWidth={3} aria-hidden />
    </span>
  )
}

/** The wizard's steps in a white frame like Safe Shield's; only completed steps jump back, since each step gates the next. */
const PolicySetupStepper = ({
  steps,
  current,
  threshold,
  onSelect,
}: {
  /** WIZARD_STEP_NAMES indexes, without any step the flow skips. */
  steps: number[]
  current: number
  threshold: number
  onSelect: (step: number) => void
}): ReactElement => (
  <nav
    aria-label="Steps"
    className="flex w-fit flex-col items-start rounded-lg bg-card p-4"
    data-m2-new="New · Clickable step rail"
  >
    {steps.map((step, index) => (
      <Fragment key={step}>
        {index > 0 && <span aria-hidden className="ml-[9px] h-6 w-0.5 bg-border" />}
        <button
          type="button"
          onClick={() => onSelect(step)}
          disabled={step >= current}
          aria-current={step === current ? 'step' : undefined}
          className={classnames(
            'group flex cursor-pointer items-center gap-3 text-left disabled:cursor-default',
            step > current ? 'text-muted-foreground' : 'text-foreground',
          )}
        >
          <StepIcon isDone={step < current} isUpcoming={step > current} />
          <StepLabel>{step === CONFIRM_STEP ? `Confirm (0 of ${threshold})` : WIZARD_STEP_NAMES[step]}</StepLabel>
        </button>
      </Fragment>
    ))}
  </nav>
)

/** TxLayoutBase's markup with PolicySetupStepper as the rail and SetupSafeShield in the Safe Shield column. */
const PolicySetupLayout = ({
  step,
  visibleSteps,
  title,
  threshold,
  choices,
  mode,
  account,
  onNext,
  onBack,
  onStepSelect,
  onClose,
  summary,
  summaryAccount,
  hideSummary = false,
  belowSummary,
  children,
}: {
  step: number
  /** The summary banner under the header on every step, and the compact header's line once it scrolls away. */
  summary: SetupSummary
  /** The account the summary describes, for the compact header; unset until one is picked. */
  summaryAccount?: M2Account
  /** Create with a failed account check: there is nothing to summarise yet. */
  hideSummary?: boolean
  /** In the header card under the summary, e.g. Create's account field. */
  belowSummary?: ReactNode
  /** The steps that apply to the account, for the stepper; children stay one per step. */
  visibleSteps: number[]
  title: string
  threshold: number
  choices: SetupChoices
  mode: WizardMode
  account: M2Account
  onNext: () => void
  onBack: () => void
  /** A click on a step in the rail. */
  onStepSelect: (step: number) => void
  /** Create's Back: the first step has no step before it, so Back closes the flow. */
  onClose?: () => void
  children: ReactElement[]
}): ReactElement => {
  const safeTx = useMemo(
    () => (step >= REVIEW_STEP ? buildSetupTransaction({ choices, mode, account }).safeTx : undefined),
    [step, choices, mode, account],
  )
  const rootRef = useRef<HTMLDivElement>(null)
  const [needsPageRoom, setNeedsPageRoom] = useState(false)
  const titleRowRef = useRef<HTMLDivElement>(null)
  const policyRowRef = useRef<HTMLDivElement>(null)
  const [isPolicyRowHidden, setIsPolicyRowHidden] = useState(false)

  // Any scroll, captured, since the flow scrolls inside its dialog in the app and the window in a story.
  useEffect(() => {
    const titleRow = titleRowRef.current
    const policyRow = policyRowRef.current
    if (!titleRow || !policyRow) return

    // Once the "Allowlist" row has slid under the pinned title.
    const update = () =>
      setIsPolicyRowHidden(policyRow.getBoundingClientRect().bottom < titleRow.getBoundingClientRect().bottom)
    update()
    document.addEventListener('scroll', update, { capture: true, passive: true })
    return () => document.removeEventListener('scroll', update, { capture: true })
  }, [])

  // A frame later: the review's own content can pull the scroll down once it mounts.
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      for (let element = rootRef.current?.parentElement; element; element = element.parentElement) {
        if (element.scrollTop > 0) element.scrollTop = 0
      }
      window.scrollTo(0, 0)
    })
    return () => cancelAnimationFrame(frame)
  }, [step])

  return (
    <MockFlowProviders step={step} safeTx={safeTx} choices={choices} onNext={onNext} onPrev={onBack}>
      <PageRoomContext.Provider value={setNeedsPageRoom}>
        <div ref={rootRef} className="px-[var(--space-3)]" data-m2-new="New · Centred flow layout">
          {/* Wide enough for the steps, the card and Safe Shield side by side: 320 + 672 + 320 + two 24px gaps. */}
          <div className="mx-auto w-full max-w-[1360px]">
            {/* From 1200px a grid whose equal side columns keep the card centred whatever the steps' width. */}
            <div className="flex flex-wrap justify-center gap-6 min-[900px]:flex-nowrap min-[1200px]:grid min-[1200px]:grid-cols-[minmax(0,1fr)_minmax(0,672px)_minmax(0,1fr)]">
              {/* Below 1200px there's no room for three columns. */}
              <aside className="hidden min-[1200px]:flex min-[1200px]:justify-end">
                <div className={classnames('self-start', SIDE_FRAME_OFFSET)}>
                  <PolicySetupStepper
                    steps={visibleSteps}
                    current={step}
                    threshold={threshold}
                    onSelect={onStepSelect}
                  />
                </div>
              </aside>

              <div className="min-w-0 flex-grow min-[900px]:max-w-[672px]">
                {/* The title stays where it is; the page colour hides what scrolls behind it. */}
                <div className="sticky top-0 z-20 bg-[var(--color-background-main)] pt-[10px] pb-[var(--space-2)] [[data-theme=dark]_&]:bg-background">
                  <div ref={titleRowRef} className={classnames(TITLE_ROW_HEIGHT, 'mb-0!', layoutCss.titleWrapper)}>
                    <Typography
                      data-testid="modal-title"
                      variant="h3"
                      className={classnames('font-bold', layoutCss.title)}
                    >
                      {title}
                    </Typography>
                    {onClose && (
                      <Button variant="surface" size="icon" aria-label="Close" onClick={onClose}>
                        <X />
                      </Button>
                    )}
                  </div>
                </div>

                <CompactHeader
                  account={summaryAccount}
                  summary={summary}
                  isVisible={isPolicyRowHidden}
                  mode={mode}
                  step={step}
                />

                <div
                  data-testid="modal-header"
                  className={classnames('overflow-hidden rounded-t-xl bg-card', layoutCss.header)}
                >
                  <div ref={policyRowRef}>
                    <TxLayoutHeader
                      subtitle={<FlowSubtitle mode={mode} step={step} />}
                      icon={isAllowlistHeader(mode, step) ? ShieldIcon : ProtectionIcon}
                      hideNonce={step < REVIEW_STEP}
                    />
                  </div>
                  {!hideSummary && <SetupSentence {...summary} />}
                  {belowSummary}
                </div>

                <div className={layoutCss.step}>
                  {children[step]}
                  {(step > 0 || onClose) && (
                    <Button
                      data-testid="modal-back-btn"
                      variant="outline"
                      onClick={step > 0 ? onBack : onClose}
                      className={layoutCss.backButton}
                    >
                      Back
                    </Button>
                  )}
                </div>
                {/* Room below the step while the address book is open, so the page can scroll its list up. */}
                {needsPageRoom && <div aria-hidden className="h-96" />}
              </div>

              <div className="w-full min-[900px]:w-[37.5%] min-[900px]:shrink-0 lg:w-[320px] min-[1200px]:max-w-full">
                <div className={SIDE_FRAME_OFFSET}>
                  <SetupSafeShield step={step} safeTx={safeTx} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </PageRoomContext.Provider>
    </MockFlowProviders>
  )
}

export type SetUpPoliciesFlowProps = ChoiceHandlers & {
  /** The account picked on Create; unset shows the dropdown alone. */
  account?: M2Account
  onAccountChange?: (account: M2Account) => void
  /** Accounts that already have an allowlist, disabled in the dropdown. */
  disabledAccountKeys?: string[]
  /** An index into WIZARD_STEP_NAMES, e.g. REVIEW_STEP. */
  step: number
  onStepChange: (step: number) => void
  preflight?: Preflight
  /** Handoff stories only: shown in place of the failed check's banner. */
  preflightBanner?: ReactNode
  viewer?: SignerId
  /** Render the flow on the page, as M1's story renders TxFlow; otherwise inside the app's tx modal, as the app does. */
  inline?: boolean
  onSign?: () => void
  onExecute?: () => void
  onClose?: () => void
  mode?: WizardMode
  /** Edit only: the allowlist as it is now, to tell whether anything changed and to mark the changes on Review. */
  initialChoices?: SetupChoices
  /** A bar above the title that scrolls away with the page, e.g. the prototype's logo and wallet bar. */
  topBar?: ReactNode
  /** The account field is read-only; an edit started from Create, by picking an account with an allowlist, keeps it changeable. */
  isAccountLocked?: boolean
  /** Started from the account's row in the table: Create shows the account as a line instead of the dropdown. */
  accountFromRow?: boolean
  /** `protection` sets up policy enforcement only (how it works, settings, review); `policy` adds the allowlist. */
  kind?: 'protection' | 'protection-edit' | 'policy'
  /** The setup started from a policy on an account with no protection: How it works says why protection comes first. */
  forPolicy?: boolean
}

export const SetUpPoliciesFlow = ({
  account,
  onAccountChange = () => {},
  disabledAccountKeys = [],
  step,
  onStepChange,
  choices,
  onChoicesChange,
  preflight = 'ready',
  preflightBanner,
  viewer = 'nadia',
  inline = false,
  onSign,
  onExecute,
  onClose,
  mode = 'create',
  initialChoices,
  topBar,
  isAccountLocked = mode === 'edit',
  accountFromRow = false,
  kind = 'policy',
  forPolicy = false,
}: SetUpPoliciesFlowProps): ReactElement => {
  // "Change tokens" on Permissions: Create scrolls to its tokens once it shows, then clears this.
  const [isTokensScrollPending, setIsTokensScrollPending] = useState(false)
  const clearTokensScroll = useCallback(() => setIsTokensScrollPending(false), [])
  const isEditMode = mode === 'edit'
  const editBaseline = isEditMode ? initialChoices : undefined
  const currentStep = Math.min(Math.max(step, 0), WIZARD_STEP_NAMES.length - 1)
  const reviewedAccount = account ?? PAYMENTS
  // The onboarding steps (how it works, settings, spending limits) are the first-time setup only. Once an account is
  // protected, a policy is the short wizard: the allowlist, then Review, Confirm and Execute.
  // A single allowlist never sets up policy enforcement, so it's always the short steps.
  const isSinglePolicy = kind === 'policy' && !isEditMode
  const isShortWizard = isEditMode || isSinglePolicy || !account
  // Policy enforcement on its own decides what happens outside the policies: the account settings. No allowlist here.
  const isProtectionEdit = kind === 'protection-edit'
  const isProtectionOnly = (kind === 'protection' || isProtectionEdit) && !isEditMode
  // The allowlist joins the protection's setup only on an account with no policies, and only when picked.
  // The allowlist is required: protection never turns on without one.
  const withAllowlist = isProtectionOnly && !isProtectionEdit
  const visibleSteps = WIZARD_STEP_NAMES.map((_, index) => index).filter((index) =>
    isProtectionEdit
      ? ![INTRO_STEP, BASELINE_STEP, POLICIES_STEP, CREATE_STEP].includes(index)
      : isProtectionOnly
        ? // How it works is the intro modal before the flow.
          ![INTRO_STEP, BASELINE_STEP, POLICIES_STEP].includes(index)
        : isShortWizard
          ? ![INTRO_STEP, SETTINGS_STEP, BASELINE_STEP, POLICIES_STEP].includes(index)
          : ![BASELINE_STEP, POLICIES_STEP].includes(index),
  )
  const earlierSteps = visibleSteps.filter((index) => index < currentStep)
  const next = () => onStepChange(visibleSteps.find((index) => index > currentStep) ?? currentStep)
  const back = () => onStepChange(earlierSteps[earlierSteps.length - 1] ?? visibleSteps[0])
  // The intro's "I understand": kept here, so going back to it doesn't untick it.
  const [hasUnderstood, setHasUnderstood] = useState(false)
  const isUnchangedEdit = editBaseline !== undefined && isUnchangedChoices(choices, editBaseline, account)
  const setupTx = useMemo(
    () => buildSetupTransaction({ choices, mode, account: reviewedAccount }).safeTx,
    [choices, mode, reviewedAccount],
  )
  // Policy enforcement can't pick an account that already has it.
  const accountEntries = useMemo(() => getAccountEntries(disabledAccountKeys, HAS_ALLOWLIST), [disabledAccountKeys])
  // Past Create the steps show reviewedAccount, so the summary does too.
  const summaryAccount = currentStep > CREATE_STEP ? reviewedAccount : account
  const isPreflightBlocked =
    currentStep === CREATE_STEP && !isEditMode && Boolean(account) && isBlockingPreflight(preflight)
  const summary = useSetupSummary(
    isProtectionOnly ? account : summaryAccount,
    choices,
    currentStep,
    isEditMode,
    isEditMode && !isAccountLocked,
    isProtectionOnly && !withAllowlist,
    isProtectionEdit,
    isSinglePolicy,
  )

  useEffect(() => {
    latestSetup.choices = choices
    latestSetup.mode = mode
    latestSetup.account = reviewedAccount
  }, [choices, mode, reviewedAccount])

  const accountField = (
    <>
      {/* Started from an account's row, the account is a given: a line, not a field. "New" still asks. */}
      {account && accountFromRow ? (
        <div className="flex flex-col gap-3 rounded-xl bg-muted p-4" data-m2-new="New · Safe account tile">
          <Typography variant="paragraph-bold">Safe account</Typography>
          {/* Identity, network, balance: three groups spread evenly, like the spending limit's account row. */}
          <div className="flex items-center justify-between gap-6">
            <SafeAddress name={account.name} address={account.address} avatarSize={32} chainId={account.chainId} />
            <span className="flex items-center gap-1.5">
              <ChainIndicator chainId={account.chainId} onlyLogo imageSize={16} />
              <Typography variant="paragraph-small" color="muted">
                {CHAIN_INFO[account.chainId]?.chainName ?? account.chainId}
              </Typography>
            </span>
            <AccountBalance fiatTotal={FIAT_TOTALS[getAccountKey(account)]} fitColumn />
          </div>
        </div>
      ) : (
        <AccountSelect
          accounts={accountEntries}
          value={account ? getAccountKey(account) : undefined}
          onChange={(id) => {
            const picked = findM2Account(id)
            if (picked) onAccountChange(picked)
          }}
          notice={NESTED_SAFES_NOTICE}
          id="recipient-allowlist-safe-account"
          readOnly={isAccountLocked}
        />
      )}
    </>
  )

  const flow = (
    <PolicySetupLayout
      title={
        isProtectionEdit && currentStep < CONFIRM_STEP
          ? 'Edit policy enforcement'
          : // One title through the whole setup, up to signing.
            isProtectionOnly && currentStep < CONFIRM_STEP
            ? 'Set up policy enforcement'
            : isSinglePolicy && currentStep === CREATE_STEP
              ? 'Add allowlist'
              : isSinglePolicy && currentStep === REVIEW_STEP
                ? 'Confirm allowlist'
                : getStepTitle(mode, currentStep)
      }
      step={currentStep}
      visibleSteps={visibleSteps}
      threshold={reviewedAccount.threshold}
      choices={choices}
      mode={mode}
      account={reviewedAccount}
      onNext={next}
      onBack={back}
      onStepSelect={onStepChange}
      onClose={onClose}
      belowSummary={
        (currentStep === CREATE_STEP || (isProtectionOnly && currentStep === SETTINGS_STEP)) && (
          // The card's own padding, which the field had inside Create's card.
          <div className="px-[var(--space-3)] pt-[var(--space-3)]">{accountField}</div>
        )
      }
      summary={summary}
      hideSummary={isPreflightBlocked || currentStep === INTRO_STEP}
      summaryAccount={summaryAccount}
    >
      <IntroStep
        key="intro"
        accountField={isProtectionOnly ? accountField : undefined}
        note={
          forPolicy && account
            ? `${account.name} doesn’t enforce policies yet. Set that up first; your allowlist is the last step.`
            : undefined
        }
        canContinue={!isProtectionOnly || Boolean(account)}
        hasUnderstood={hasUnderstood}
        onUnderstoodChange={setHasUnderstood}
        onNext={next}
      />
      <SettingsStep
        key="settings"
        choices={choices}
        onChoicesChange={onChoicesChange}
        onNext={next}
        isUnchangedEdit={false}
        hasAccount={!isProtectionOnly || Boolean(account)}
      />
      <BaselineStep key="everything-else" choices={choices} onChoicesChange={onChoicesChange} onNext={next} />
      <PoliciesStep
        key="policies"
        account={account}
        choices={choices}
        onChoicesChange={onChoicesChange}
        onNext={next}
      />
      <CreateStep
        key="create"
        account={account}
        choices={choices}
        onChoicesChange={onChoicesChange}
        // The pre-setup checks passed when the allowlist was created.
        preflight={isEditMode ? 'ready' : preflight}
        preflightBanner={preflightBanner}
        onNext={next}
        isEditMode={isEditMode}
        // The short wizard goes straight to Review from here, so Next waits for a change.
        isUnchangedEdit={isUnchangedEdit}
        scrollToTokens={isTokensScrollPending}
        onScrolledToTokens={clearTokensScroll}
      />
      <ReviewStep
        key="review"
        account={reviewedAccount}
        choices={choices}
        viewer={viewer}
        onNext={next}
        mode={mode}
        initialChoices={editBaseline}
        protectionOnly={isProtectionOnly && !withAllowlist}
        isSinglePolicy={isSinglePolicy}
      />
      <ReceiptStep key="confirm" action="sign" safeTx={setupTx} onSubmit={onSign} />
      <ReceiptStep key="execute" action="execute" safeTx={setupTx} onSubmit={onExecute} />
    </PolicySetupLayout>
  )

  if (inline) return flow

  return (
    <M2FlowDialog onClose={onClose} topBar={topBar}>
      {flow}
    </M2FlowDialog>
  )
}

/** TxModalDialog without its corner X or the right gutter kept for it: the flow draws its own X by the title. */
const M2FlowDialog = ({
  children,
  onClose,
  topBar,
}: {
  children: ReactNode
  onClose?: () => void
  /** Scrolls with the page, so the dialog starts at the very top and the title can pin there. */
  topBar?: ReactNode
}): ReactElement => {
  const portalContainer = usePortalContainer()

  return (
    <DialogPrimitive.Root open onOpenChange={(nextOpen) => !nextOpen && onClose?.()}>
      <DialogPrimitive.Portal container={portalContainer}>
        <DialogPrimitive.Popup
          className={classnames(
            txDialogCss.dialog,
            txDialogCss.paper,
            txDialogCss.fullWidth,
            Boolean(topBar) && 'top-0!',
          )}
          onClick={(event) => event.stopPropagation()}
        >
          <div tabIndex={-1} className="text-[var(--color-text-primary)]">
            {topBar}
            {children}
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

export type SecondSignerConfirmProps = {
  choices: SetupChoices
  onConfirm?: () => void
  onClose?: () => void
}

/** What a second signer sees when they open the setup transaction to confirm it. */
export const SecondSignerConfirm = ({ choices, onConfirm, onClose }: SecondSignerConfirmProps): ReactElement => {
  // The first signer's Review summary, worded for approving.
  const reviewSummary = useSetupSummary(PAYMENTS, choices, REVIEW_STEP, false)
  const summary =
    reviewSummary.tone === 'warning'
      ? reviewSummary
      : { ...reviewSummary, description: 'Check the details below before you approve.' }

  return (
    <TxModalDialog open fullWidth onClose={onClose}>
      <TxLayout title="Confirm policy" subtitle={<FlowSubtitle mode="create" step={REVIEW_STEP} />} icon={ShieldIcon}>
        <TxCard>
          <SummaryAlert {...summary} />

          <PolicySummary choices={choices} />

          <PrimaryAction label="Confirm with Ledger" onClick={onConfirm} />
        </TxCard>
      </TxLayout>
    </TxModalDialog>
  )
}
