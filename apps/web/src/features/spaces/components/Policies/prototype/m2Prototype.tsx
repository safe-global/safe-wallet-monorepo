import { useEffect, useRef, useState, type MouseEvent, type ReactElement, type ReactNode } from 'react'
import type { Decorator } from '@storybook/react'
import { http, HttpResponse } from 'msw'
import { ChevronDown, Copy } from 'lucide-react'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import type {
  MemberDto,
  SpaceAddressBookDto,
  SpaceAddressBookItemDto,
} from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import Identicon from '@/components/common/Identicon'
import InitialsAvatar from '@/components/common/InitialsAvatar'
import Notifications from '@/components/common/Notifications'
import { Button, buttonVariants } from '@safe-global/views/components/ui/button'
import { cn } from '@safe-global/views/utils/cn'
import LinkIcon from '@safe-global/views/assets/images/common/link.svg'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@safe-global/views/components/ui/collapsible'
import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'
import { Typography } from '@safe-global/views/components/ui/typography'
import { chainsAdapter, chainsInitialState } from '@safe-global/store/gateway'
import { cgwClient } from '@safe-global/store/gateway/cgwClient'
import { CONFIG_SERVICE_KEY } from '@/config/constants'
import { AppRoutes } from '@/config/routes'
import { useAppDispatch } from '@/store'
import { showNotification } from '@/store/notificationsSlice'
import {
  coreHandlers,
  createChainData,
  createChainsPageData,
  createMockStory,
  type MockStoryConfig,
} from '@/stories/mocks'
import { createChainsPageDataV2 } from '@/stories/mocks/chains'
import { createMockSpace } from '@/stories/mocks/handlers'

// The sidebar only matches a Workspace by UUID, so a legacy numeric id would leave the space selector empty.
const SPACE_ID = '3f1c9a2e-5b7d-4e8a-9c6f-1a2b3c4d5e6f'
export const SPACE_NAME = 'Acme Inc'

export type M2Account = {
  name: string
  address: string
  chainId: string
  version: string
  threshold: number
  owners: number
}

export const PAYMENTS: M2Account = {
  name: 'Payments',
  address: '0x5a0c3e8b91d7f4a26c0e5b9d13f78a6c4e2ba2f1',
  chainId: '1',
  version: '1.4.1',
  threshold: 2,
  owners: 3,
}

export const TREASURY: M2Account = {
  name: 'Treasury',
  address: '0x8675b754342754a30a2aef474d114d8460bcca19',
  chainId: '1',
  version: '1.4.1',
  threshold: 3,
  owners: 5,
}

export const TRADING_DESK: M2Account = {
  name: 'Trading desk',
  address: '0x3fc9a1e2d3c4b5a6978899aabbccddeeff007b12',
  chainId: '42161',
  version: '1.4.1',
  threshold: 2,
  owners: 4,
}

export const VAULT_3: M2Account = {
  name: 'Vault 3',
  address: '0xeb8c6d2f9a0b1c3e4d5f6a7b8c9d0e1f2a3b5f18',
  chainId: '8453',
  version: '1.4.1',
  threshold: 2,
  owners: 2,
}

export const OPERATIONS: M2Account = {
  name: 'Operations',
  address: '0x9a4b2c6d8e0f1a3b5c7d9e1f2a4b6c8d0e2f4a63',
  chainId: '42161',
  version: '1.4.1',
  threshold: 2,
  owners: 2,
}

/** Policies are per network, so a Safe on two networks is two accounts here. */
export const PAYMENTS_ARBITRUM: M2Account = { ...PAYMENTS, chainId: '42161', threshold: 2, owners: 2 }
export const TREASURY_BASE: M2Account = { ...TREASURY, chainId: '8453' }

export const getAccountKey = ({ chainId, address }: M2Account): string => `${chainId}:${address}`

/** An account's existing spending limit, as the recipient allowlist's token check sees it. */
export type AccountSpendingLimit = {
  spender: string
  /** The token the limit sends, by symbol. */
  token: string
  label: string
}

const ACCOUNT_SPENDING_LIMITS: Record<string, AccountSpendingLimit[]> = {
  [getAccountKey(PAYMENTS)]: [
    { spender: 'Ops bot', token: 'USDC', label: 'Ops bot · 500 USDC per day' },
    { spender: 'Payroll bot', token: 'ETH', label: 'Payroll bot · 1 ETH per week' },
  ],
  [getAccountKey(TRADING_DESK)]: [
    { spender: 'Market maker bot', token: 'USDC', label: 'Market maker bot · 250 USDC per day' },
    { spender: 'Rebalancer', token: 'ETH', label: 'Rebalancer · 2 ETH per week' },
  ],
}

/** Every other account has none. */
export const getAccountSpendingLimits = (account?: M2Account): AccountSpendingLimit[] =>
  account ? (ACCOUNT_SPENDING_LIMITS[getAccountKey(account)] ?? []) : []

/** A live recipient allowlist's token and existing-permissions choices, as its Create form left them. */
export type AllowlistSettings = {
  /** Symbols of the account's tokens the allowlist leaves out. */
  excludedTokens: string[]
  /** Whether it also checks the account's existing spending limits. */
  applyToSpendingLimits: boolean
}

const DEFAULT_ALLOWLIST_SETTINGS: AllowlistSettings = { excludedTokens: [], applyToSpendingLimits: true }

// Payments' setup follows the prototype's own choices, so it isn't listed here.
const ALLOWLIST_SETTINGS: Record<string, AllowlistSettings> = {
  [getAccountKey(TRADING_DESK)]: { excludedTokens: ['USDC'], applyToSpendingLimits: true },
}

/** Every other allowlist allows all its account's tokens and applies to existing permissions. */
export const getAllowlistSettings = (account: M2Account): AllowlistSettings =>
  ALLOWLIST_SETTINGS[getAccountKey(account)] ?? DEFAULT_ALLOWLIST_SETTINGS

export type SignerId = 'nadia' | 'tom' | 'priya'

export const SIGNERS: { id: SignerId; name: string; firstName: string }[] = [
  { id: 'nadia', name: 'Nadia Kaur', firstName: 'Nadia' },
  { id: 'tom', name: 'Tom Reyes', firstName: 'Tom' },
  { id: 'priya', name: 'Priya Shah', firstName: 'Priya' },
]

export const getSigner = (id: SignerId) => SIGNERS.find((signer) => signer.id === id) ?? SIGNERS[0]

/** How long signers have left on a pending transaction (fixed for the prototype). */
export const SIGNING_TIME_LEFT = '6 days left · until Oct 21, 2026'

/** The prototype signs in SIGNERS order, so the signers after the first `signed` are the ones still to sign. */
export const WaitingForSigners = ({
  signed,
  required,
  owners,
}: {
  signed: number
  required: number
  owners: number
}): ReactElement => {
  const dispatch = useAppDispatch()
  const [notified, setNotified] = useState<SignerId[]>([])

  if (signed >= required) return <span className="text-muted-foreground">No one, ready to execute</span>

  const named = SIGNERS.slice(signed, owners)
  const unnamed = Math.max(owners - Math.max(signed, SIGNERS.length), 0)

  const notify = (id: SignerId, name: string) => {
    setNotified((current) => [...current, id])
    dispatch(
      showNotification({ message: `${name} was reminded to sign`, variant: 'success', groupKey: `notify-${id}` }),
    )
  }

  return (
    <span className="flex flex-col items-end gap-2" data-m2-new="New · Waiting for + Notify">
      {named.map(({ id, name }) => (
        <span key={id} className="flex items-center gap-2">
          {/* 24px, the Safe account identicon's size above. */}
          <InitialsAvatar name={name} size="small" rounded />
          {name}
          <Button
            variant="outline"
            size="xs"
            disabled={notified.includes(id)}
            onClick={(event) => {
              event.stopPropagation()
              notify(id, name)
            }}
          >
            {notified.includes(id) ? 'Notified' : 'Notify'}
          </Button>
        </span>
      ))}
      {unnamed > 0 && <span className="text-muted-foreground">+{unnamed} more</span>}
    </span>
  )
}

/** "Tom and Priya" — everyone except the given signer. */
export const otherSignerNames = (id: SignerId): string =>
  SIGNERS.filter((signer) => signer.id !== id)
    .map((signer) => signer.firstName)
    .join(' and ')

export type M2Contact = { name: string; address: string; addedBy: SignerId; addedDaysAgo: number }

/** Served by the mocked Workspace contacts endpoint too, so "Add from address book" and the address book icon agree. */
export const ADDRESS_BOOK: M2Contact[] = [
  {
    name: 'Payroll — Deel',
    address: '0x4bc91d2e3f4a5b6c7d8e9f0a1b2c3d4e5f60a88b',
    addedBy: 'nadia',
    addedDaysAgo: 214,
  },
  {
    name: 'Coinbase Prime',
    address: '0x9cd45e6f708192a3b4c5d6e7f8091a2b3c4d9013',
    addedBy: 'tom',
    addedDaysAgo: 160,
  },
  {
    name: 'Legal counsel',
    address: '0x5e2a1b3c4d5e6f708192a3b4c5d6e7f8091a77d0',
    addedBy: 'priya',
    addedDaysAgo: 92,
  },
  {
    name: 'Payroll provider',
    address: '0x9f13a4b5c6d7e8f9012a3b4c5d6e7f8091a2c2a8',
    addedBy: 'nadia',
    addedDaysAgo: 38,
  },
  {
    name: 'Marketing agency',
    address: '0x3b47c8d9e0f1a2b3c4d5e6f708192a3b4c5d0e91',
    addedBy: 'tom',
    addedDaysAgo: 6,
  },
]

export const findAddressBookContact = (address: string): M2Contact | undefined =>
  ADDRESS_BOOK.find((contact) => contact.address.toLowerCase() === address.toLowerCase())

const ethereum = createChainData({ spaces: true })
// GTF registers the review's Fees block (FeesPreview's slot condition).
ethereum.features = [...ethereum.features, FEATURES.POLICIES, FEATURES.GTF]

// Fake chain configs: the shared chain fixtures only hold Ethereum, Sepolia, Polygon and Hoodi.
const fakeChain = (chainId: string, chainName: string, shortName: string): Chain => ({
  ...ethereum,
  chainId,
  chainName,
  shortName,
  l2: true,
  // The production asset host: the staging one only carries the fixtures' chains.
  chainLogoUri: `https://safe-transaction-assets.safe.global/chains/${chainId}/chain_logo.png`,
})

const M2_CHAINS = [ethereum, fakeChain('42161', 'Arbitrum', 'arb1'), fakeChain('8453', 'Base', 'base')]

const chainsV1 = { ...createChainsPageData(ethereum), results: M2_CHAINS }
const chainsV2Default = createChainsPageDataV2(ethereum)
const chainsV2 = { ...chainsV2Default, results: [...M2_CHAINS, ...chainsV2Default.results.slice(1)] }

/** Seeded as a fulfilled query (as SafeSidebar.stories does) so ChainIndicator knows Arbitrum and Base on first render. */
const CHAINS_STORE = {
  [cgwClient.reducerPath]: {
    queries: {
      [`getChainsConfigV2("${CONFIG_SERVICE_KEY}")`]: {
        status: 'fulfilled',
        endpointName: 'getChainsConfigV2',
        requestId: 'policies-m2-prototype',
        originalArgs: CONFIG_SERVICE_KEY,
        startedTimeStamp: Date.now(),
        data: chainsAdapter.setAll(chainsInitialState, chainsV2.results),
        fulfilledTimeStamp: Date.now(),
        error: undefined,
      },
    },
    mutations: {},
    provided: { tags: {}, keys: {} },
    subscriptions: {},
    config: {
      online: true,
      focused: true,
      middlewareRegistered: false,
      refetchOnFocus: false,
      refetchOnReconnect: false,
      refetchOnMountOrArgChange: false,
      keepUnusedDataFor: 60,
      reducerPath: cgwClient.reducerPath,
      invalidationBehavior: 'delayed',
    },
  },
}

const acmeSpace = { ...createMockSpace(SPACE_ID), name: SPACE_NAME }
const m1Space = { ...createMockSpace(), name: SPACE_NAME }

/** `SAFE_ADDRESSES.efSafe`: the Safe every story's tx flow runs on, since the app shell loads it from the URL. */
const EF_SAFE = '0x9fC3dc011b461664c835F2527fffb1169b3C213e'
/** efSafe fixture's `owners[0].value` — what `wallet: 'owner'` resolves to. */
const OWNER_WALLET = '0x5eD8Cee6b63b1c6AFce3AD7c92f4fD7E1B8fAd9F'

const safeOverview = (address: string, threshold: number, owners: string[], fiatTotal: string) => ({
  address: { value: address, name: null, logoUri: null },
  chainId: '1',
  threshold,
  owners: owners.map((value) => ({ value, name: null, logoUri: null })),
  fiatTotal,
  queued: 0,
  awaitingConfirmation: null,
})

/** Without the Space's Safes, Safe Shield reports the flow's Safe as "Not in your accounts". */
const spaceSafesHandlers = [
  http.get(/\/v1\/spaces\/[^/]+\/safes$/, () => HttpResponse.json({ safes: { '1': [EF_SAFE, PAYMENTS.address] } })),
  http.get(/\/v2\/safes$/, () =>
    HttpResponse.json([
      safeOverview(
        EF_SAFE,
        3,
        [
          OWNER_WALLET,
          '0x1De7F5cc55653C581d1c842AD155f88cE389E0B2',
          '0x24BBC568dC89E4e57bAF23b759989F3D6113BBaA',
          '0x26C3f6fD4f53a03eC8e54Aca0c356112cA3DDEc8',
          '0xB4F04a5ae4B0B7D0d3e6a1E2a5d3e0F1d2c3b4A5',
        ],
        '123720',
      ),
      safeOverview(
        PAYMENTS.address,
        PAYMENTS.threshold,
        [OWNER_WALLET, '0x1De7F5cc55653C581d1c842AD155f88cE389E0B2', '0x24BBC568dC89E4e57bAF23b759989F3D6113BBaA'],
        '48210.55',
      ),
    ]),
  ),
  http.get(/\/v1\/chains\/\d+\/tokens(\?|$)/, () => HttpResponse.json([])),
  // Safe Shield's threat analysis: no findings, so the review's Balance change reads "No balance change detected".
  http.post(/\/v1\/chains\/\d+\/security\/0x[a-fA-F0-9]+\/threat-analysis$/, () => HttpResponse.json({})),
]

const chainHandlers = [
  http.get(/\/v1\/chains\/(\d+)$/, ({ request }) => {
    const chainId = new URL(request.url).pathname.split('/').pop()
    return HttpResponse.json(M2_CHAINS.find((chain) => chain.chainId === chainId) ?? ethereum)
  }),
  http.get(/\/v1\/chains$/, () => HttpResponse.json(chainsV1)),
  http.get(/\/v2\/chains$/, () => HttpResponse.json(chainsV2)),
]

const DAY_MS = 24 * 60 * 60 * 1000
const daysAgo = (days: number): string => new Date(Date.now() - days * DAY_MS).toISOString()

// User 1 is the stories' signed-in user, so Nadia, the default viewer, is the one signed in.
const memberUserId = (id: SignerId): number => SIGNERS.findIndex((signer) => signer.id === id) + 1
const memberEmail = (id: SignerId): string => `${getSigner(id).firstName.toLowerCase()}@example.com`

const WORKSPACE_MEMBERS: MemberDto[] = SIGNERS.map(({ id, name }, index): MemberDto => ({
  id: memberUserId(id),
  role: index === 0 ? 'ADMIN' : 'MEMBER',
  status: 'ACTIVE',
  name,
  invitedBy: index === 0 ? null : 1,
  createdAt: daysAgo(400),
  updatedAt: daysAgo(400),
  user: { id: memberUserId(id), status: 'ACTIVE', email: memberEmail(id), address: null },
}))

/** A contact as the Workspace contacts endpoint returns it, with who added it and when. */
export const toSpaceContact = ({ name, address, addedBy, addedDaysAgo }: M2Contact): SpaceAddressBookItemDto => ({
  name,
  address: checksumAddress(address),
  chainIds: M2_CHAINS.map(({ chainId }) => chainId),
  createdBy: memberEmail(addedBy),
  createdByUserId: memberUserId(addedBy),
  lastUpdatedBy: memberEmail(addedBy),
  lastUpdatedByUserId: memberUserId(addedBy),
  createdAt: daysAgo(addedDaysAgo),
  updatedAt: daysAgo(addedDaysAgo),
})

/** The Workspace's contacts and members, which M1's contact list shows with "Added by ‹member›". */
const workspaceHandlers = [
  http.get(/\/v1\/spaces\/[^/]+\/address-book$/, () => {
    const addressBook: SpaceAddressBookDto = { spaceUuid: SPACE_ID, data: ADDRESS_BOOK.map(toSpaceContact) }
    return HttpResponse.json(addressBook)
  }),
  http.get(/\/v1\/spaces\/[^/]+\/members$/, () => HttpResponse.json({ members: WORKSPACE_MEMBERS })),
]

/** M1's SpendingLimitFlow story setup, so a flow story renders in the same shell as M1's "Create new policy". */
export const createM1FlowStory = (options: Pick<MockStoryConfig, 'store'> = {}) => {
  const setup = createMockStory({
    scenario: 'efSafe',
    wallet: 'owner',
    features: { spaces: true },
    layout: 'fullPage',
    shadcn: true,
    pathname: '/spaces/policies',
    query: { spaceId: 'uuid-1' },
    store: { ...options.store, ...CHAINS_STORE },
  })

  return {
    decorator: withPrototypeChrome(setup.decorator, true),
    parameters: {
      layout: 'fullscreen',
      ...setup.parameters,
      // M1's space id with the Acme Inc name, so the address book contacts read "Contacts of Acme Inc".
      msw: {
        handlers: [
          ...chainHandlers,
          http.get(/\/v1\/spaces\/[^/]+$/, () => HttpResponse.json(m1Space)),
          http.get(/\/v1\/spaces$/, () => HttpResponse.json([m1Space])),
          ...workspaceHandlers,
          ...spaceSafesHandlers,
          ...coreHandlers(ethereum),
          ...setup.handlers,
        ],
      },
    },
  }
}

/** Topbar draws a second Safe logo on exactly /spaces/policies (`isPoliciesRoute`), so the stories use a sub-route. */
const PROTOTYPE_PATHNAME = `${AppRoutes.spaces.policies}/prototype`

const GEIST_MONO_URL = 'https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400;500;600;700&display=swap'

// The app loads no Geist Mono and EthHashInfo has no font prop, so the prototype sets the mono font for its pages.
const PROTOTYPE_CSS = `
/* Toasts sit beside an open side panel instead of over it: the floating Drawer is 440px (700px when lg) plus its 12px inset. */
[data-m2-toasts] > div {
  transition: right 200ms ease-in-out;
}
@media (min-width: 900px) {
  body:has([data-slot='sheet-content'][data-side='right'][data-open]) [data-m2-toasts] > div {
    right: 452px;
  }
  body:has([data-slot='sheet-content'][data-side='right'][data-open][class*='w-[700px]']) [data-m2-toasts] > div {
    right: 712px;
  }
}
:root {
  --font-mono: 'Geist Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
  --m2-new-mark: #c026d3;
  --m2-copy-mark: #7c3aed;
}
[class*="addressContainer"] > div:first-child {
  font-family: var(--font-mono);
}
/* App tooltips on the light popover style (NetworkLogosTooltip, PolicyTokens) get the standard dark one. */
[data-slot="tooltip-content"].bg-popover {
  background-color: var(--foreground);
  color: var(--background);
  box-shadow: none;
}
[data-slot="tooltip-content"].bg-popover * {
  color: inherit;
}
[data-slot="tooltip-content"].bg-popover > [data-side] {
  display: block;
}
/* Side panels (the app's Drawer, recognised by its own close button): 16px inside, not 24px. */
[data-slot="sheet-content"]:has(> button[aria-label="Close"]) > div:first-child > div {
  padding-left: 16px;
  padding-right: 16px;
}
[data-slot="sheet-content"]:has(> button[aria-label="Close"]) > div:first-child > div:first-child {
  padding-top: 16px;
  /* Room for the close button: 16px inset + 36px button + 12px gap. */
  padding-right: 64px;
}
[data-slot="sheet-content"]:has(> button[aria-label="Close"]) > div:first-child > div:last-child {
  padding-bottom: 16px;
}
[data-slot="sheet-content"] > button[aria-label="Close"] {
  top: 16px;
  right: 16px;
}
/* Narrow topbar (burger showing) as the live Policies page lays it out: one row, no "Search for anything" row. */
header[class*="@container"]:has(> button[aria-label="Open sidebar menu"]) {
  align-items: center;
}
header[class*="@container"]:has(> button[aria-label="Open sidebar menu"]) > div:has(> button[aria-label="Search for anything"]) {
  display: none;
}
header[class*="@container"]:has(> button[aria-label="Open sidebar menu"]) > div:has([data-testid="notifications-center"]) {
  margin-left: auto;
}
/* Prototype dropdowns: a thin scrollbar, and a bottom fade the list's padding lets the last item clear. */
[data-m2-dropdown] [data-slot="select-scroll-up-button"],
[data-m2-dropdown] [data-slot="select-scroll-down-button"] {
  display: none !important;
}
[data-m2-dropdown] [data-slot="select-list"],
[data-m2-dropdown] [data-slot="combobox-list"] {
  scrollbar-width: thin !important;
  scrollbar-color: var(--border) transparent;
  padding-bottom: 24px;
}
[data-m2-dropdown] [data-slot="select-list"]::-webkit-scrollbar,
[data-m2-dropdown] [data-slot="combobox-list"]::-webkit-scrollbar {
  display: block !important;
}
[data-m2-dropdown]::after {
  content: '';
  position: absolute;
  inset: auto 0 0 0;
  height: 32px;
  pointer-events: none;
  background: linear-gradient(to bottom, transparent, var(--popover));
}
/* DrawerBody's scroll fade, bottom edge only: the top one showed over the first section before any scrolling. */
[data-slot="sheet-content"] [class*="scrollFade"] {
  mask-image: linear-gradient(to bottom, black 0, black calc(100% - var(--drawer-fade-bottom)), transparent 100%);
}
/* "Mark new components" (prototype bar): only applies while <html> carries the flag, so portals are marked too. */
html[data-m2-mark-new] [data-m2-new] {
  --m2-mark: var(--m2-new-mark);
  outline: 2px dashed var(--m2-mark) !important;
  outline-offset: -2px !important;
}
html[data-m2-mark-new] [data-m2-new^="M1 copy"] {
  --m2-mark: var(--m2-copy-mark);
}
/* The label needs the marked element as its containing block; dropdown popups are positioned already. */
html[data-m2-mark-new] [data-m2-new]:not([data-m2-dropdown]) {
  position: relative;
}
html[data-m2-mark-new] [data-m2-new]::before {
  content: attr(data-m2-new);
  position: absolute;
  top: 0;
  left: 0;
  z-index: 60;
  padding: 1px 6px;
  border-radius: 0 0 6px 0;
  background: var(--m2-mark);
  color: #fff;
  font: 600 10px/14px ui-sans-serif, system-ui, sans-serif;
  letter-spacing: 0;
  text-transform: none;
  white-space: nowrap;
  pointer-events: none;
}
html[data-m2-mark-new] [data-m2-new][data-m2-new-corner="end"]::before {
  left: auto;
  right: 0;
  border-radius: 0 0 0 6px;
}
/* Repeated small pieces (table cells, chips): a thin outline, the label only on hover, below so tooltips stay clear. */
html[data-m2-mark-new] [data-m2-new][data-m2-new-compact] {
  outline-width: 1px !important;
  outline-offset: 0 !important;
}
html[data-m2-mark-new] [data-m2-new][data-m2-new-compact]::before {
  display: none;
}
html[data-m2-mark-new] [data-m2-new][data-m2-new-compact]:hover::before {
  display: block;
  top: 100%;
  border-radius: 4px;
}
`

/** The prototype's font and CSS, removed again when the story unmounts. */
const PrototypeStyles = (): null => {
  useEffect(() => {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = GEIST_MONO_URL
    const style = document.createElement('style')
    style.setAttribute('data-prototype', 'styles')
    style.textContent = PROTOTYPE_CSS
    document.head.append(link, style)

    return () => {
      link.remove()
      style.remove()
    }
  }, [])

  return null
}

/** The prototype's styles around the shell; `notifications` adds the app's toasts, which the story shell leaves out. */
const withPrototypeChrome = (decorator: Decorator, notifications: boolean): Decorator => {
  const PrototypeChrome: Decorator = (Story, context) => (
    <>
      <PrototypeStyles />
      {decorator(
        () => (
          <>
            <Story />
            {notifications && (
              <div data-m2-toasts="">
                <Notifications />
              </div>
            )}
          </>
        ),
        context,
      )}
    </>
  )
  return PrototypeChrome
}

/** The real app shell (sidebar + top bar) with the Acme Inc space and Policies switched on. */
export const createPoliciesM2Story = (
  options: Pick<MockStoryConfig, 'wallet' | 'store'> & {
    /** False when the story mounts the toasts itself (the full flow, whose wizard covers the page). */
    notifications?: boolean
  } = {},
) => {
  const setup = createMockStory({
    scenario: 'efSafe',
    wallet: options.wallet ?? 'connected',
    store: { ...options.store, ...CHAINS_STORE },
    layout: 'fullPage',
    pathname: PROTOTYPE_PATHNAME,
    features: { spaces: true },
    query: { spaceId: SPACE_ID },
    shadcn: true,
  })

  // MSW is first-match-wins, so these go before the defaults.
  const handlers = [
    ...chainHandlers,
    http.get(/\/v1\/spaces\/[^/]+$/, () => HttpResponse.json(acmeSpace)),
    http.get(/\/v1\/spaces$/, () => HttpResponse.json([acmeSpace])),
    ...workspaceHandlers,
    ...spaceSafesHandlers,
    ...coreHandlers(ethereum),
    ...setup.parameters.msw.handlers,
  ]

  return {
    decorator: withPrototypeChrome(setup.decorator, options.notifications ?? true),
    parameters: {
      layout: 'fullscreen',
      ...setup.parameters,
      msw: { handlers },
    },
  }
}

type PageHeadingProps = {
  title: ReactNode
  subtitle?: ReactNode
  action?: ReactNode
}

/** The title copies M1's Policies page title exactly (Policies/index.tsx). */
export const PageHeading = ({ title, subtitle, action }: PageHeadingProps): ReactElement => (
  <div className="flex flex-wrap items-center justify-between gap-4" data-m2-new="M1 copy · Page heading">
    <div className="flex min-w-0 items-center gap-3">
      <div className="flex min-w-0 flex-col gap-6">
        <Typography variant="h2" className="font-bold leading-[1] tracking-tight">
          {title}
        </Typography>
        {subtitle}
      </div>
    </div>

    {action}
  </div>
)

/** Collapsed section for anything technical; the main surface stays plain. */
export const ShowDetails = ({ children }: { children: ReactNode }): ReactElement => (
  <Collapsible>
    <CollapsibleTrigger render={<Button variant="ghost-muted" size="xs" className="-ml-4" />}>
      Show details
      <ChevronDown data-icon="inline-end" />
    </CollapsibleTrigger>
    <CollapsibleContent>
      <div className="flex flex-col gap-3 pt-2">{children}</div>
    </CollapsibleContent>
  </Collapsible>
)

/** The app's CopyAddressButton brings its own tooltip and no toast, which doesn't work inside the address tooltip. */
const CopyAddressIcon = ({ address }: { address: string }): ReactElement => {
  const dispatch = useAppDispatch()

  const copy = (event: MouseEvent) => {
    // The tooltip is portalled, but React still bubbles the click to the table row.
    event.stopPropagation()
    navigator.clipboard
      .writeText(address)
      .then(() =>
        dispatch(
          showNotification({
            message: 'Address copied to clipboard',
            variant: 'info',
            groupKey: 'prototype-copy-address',
          }),
        ),
      )
      .catch(() => undefined)
  }

  return (
    <Button variant="ghost" size="icon-xs" aria-label="Copy address" onClick={copy}>
      <Copy aria-hidden />
    </Button>
  )
}

/** AccountIdentity's address style (12px, mono, muted), with Figma's normal line height. */
const ShortAddress = ({ address }: { address: string }): ReactElement => (
  <Typography variant="paragraph-mini" color="muted" className="font-mono leading-[normal]">
    {/* In a mono font each dot of "..." takes a full slot, so two of them are drawn closer. */}
    {shortenAddress(address).slice(0, 6)}
    <span className="tracking-[-0.25em]">..</span>.{shortenAddress(address).slice(-4)}
  </Typography>
)

/** Each prototype network's block explorer, as its chain config's address template would build it. */
const EXPLORERS: Record<string, { name: string; url: string }> = {
  '1': { name: 'Etherscan', url: 'https://etherscan.io/address/' },
  '42161': { name: 'Arbiscan', url: 'https://arbiscan.io/address/' },
  '8453': { name: 'Basescan', url: 'https://basescan.org/address/' },
}

/** ExplorerButton's link without its own tooltip, since it already sits in one; stops the click opening a table row. */
const ExplorerAddressIcon = ({ address, chainId }: { address: string; chainId: string }): ReactElement => {
  const explorer = EXPLORERS[chainId] ?? EXPLORERS['1']

  return (
    <a
      href={`${explorer.url}${address}`}
      target="_blank"
      rel="noreferrer"
      aria-label={`View on ${explorer.name}`}
      onClick={(event) => event.stopPropagation()}
      className={cn(buttonVariants({ variant: 'ghost', size: 'icon-xs' }), 'text-inherit hover:text-inherit')}
    >
      <LinkIcon className="size-4" />
    </a>
  )
}

export const FullAddress = ({ address, chainId }: { address: string; chainId: string }): ReactElement => (
  <span className="flex items-center gap-1 whitespace-nowrap font-mono">
    {checksumAddress(address)}
    <CopyAddressIcon address={checksumAddress(address)} />
    <ExplorerAddressIcon address={checksumAddress(address)} chainId={chainId} />
  </span>
)

const NameLine = ({ name, nameSuffix }: { name?: string; nameSuffix?: ReactNode }): ReactElement | null =>
  name ? (
    <span className="flex min-w-0 items-center gap-1">
      <Typography variant="paragraph-small-medium" className="truncate">
        {name}
      </Typography>
      {nameSuffix}
    </span>
  ) : null

/** How long the tooltip waits before closing, so the pointer can cross from the address to the tooltip's copy button. */
const TOOLTIP_CLOSE_DELAY_MS = 150

/** Name over a short address; the tooltip stays open while the pointer is in it, so its buttons can be clicked. */
export const SafeAddress = ({
  name,
  address,
  avatarSize = 24,
  nameSuffix,
  chainId = '1',
}: {
  name?: string
  address: string
  avatarSize?: number
  nameSuffix?: ReactNode
  /** Picks the block explorer. */
  chainId?: string
}): ReactElement => {
  const [isOpen, setIsOpen] = useState(false)
  const closeTimer = useRef<number>(undefined)

  const show = () => {
    window.clearTimeout(closeTimer.current)
    setIsOpen(true)
  }
  const hide = () => {
    window.clearTimeout(closeTimer.current)
    closeTimer.current = window.setTimeout(() => setIsOpen(false), TOOLTIP_CLOSE_DELAY_MS)
  }

  useEffect(() => () => window.clearTimeout(closeTimer.current), [])

  return (
    <div
      className="flex min-w-0 items-center gap-2"
      data-m2-new="New · Safe address (tooltip, copy, explorer)"
      data-m2-new-compact=""
    >
      <Tooltip open={isOpen} onOpenChange={(next) => (next ? show() : hide())}>
        <TooltipTrigger render={<span className="inline-flex shrink-0" />}>
          <Identicon address={address} size={avatarSize} />
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-none" onMouseEnter={show} onMouseLeave={hide}>
          <FullAddress address={address} chainId={chainId} />
        </TooltipContent>
      </Tooltip>

      <div className="flex min-w-0 flex-col">
        <NameLine name={name} nameSuffix={nameSuffix} />
        <span className="w-fit" onMouseEnter={show} onMouseLeave={hide}>
          <ShortAddress address={address} />
        </span>
      </div>
    </div>
  )
}

/** The page body inside the app shell: `<main>` carries the app's page gutter. */
export const PolicyPage = ({ header, children }: { header: ReactNode; children: ReactNode }): ReactElement => (
  <main>
    <div className="mb-6">{header}</div>

    {children}
  </main>
)
