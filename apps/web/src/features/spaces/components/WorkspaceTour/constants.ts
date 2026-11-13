import { ArrowRightLeft, Coins, LayoutGrid, Settings, TrendingUp, UsersRound, WalletCards } from 'lucide-react'
import { AppRoutes } from '@/config/routes'
import { getSidebarItemTestId } from '../Sidebar/utils'
import type { TourNextActionLink, TourStep } from './types'

const byTestId = (testId: string) => `[data-testid="${testId}"]`

const sidebarItem = (label: string) => byTestId(getSidebarItemTestId(label))

const selectedAddressBookTab = (tabTestId: string) =>
  `main [data-slot="tabs"]:has(${byTestId(tabTestId)}[aria-selected="true"])`

const ADDRESS_BOOK_EMPTY = byTestId('address-book-empty')

export const SIDEBAR = byTestId('sidebar-container')

export const TOUR_STEPS: TourStep[] = [
  {
    id: 'switcher',
    route: AppRoutes.spaces.index,
    sidebarItem: byTestId('space-selector-button'),
    placement: { side: 'right', align: 'start' },
    title: 'Your workspace',
    body: 'Switch between workspaces here.',
  },
  {
    id: 'signed-in',
    route: AppRoutes.spaces.index,
    anchor: byTestId('header-account-info'),
    placement: { side: 'bottom', align: 'end' },
    title: 'Signed in as',
    body: 'Your Sign-In with Ethereum account. It sets which workspaces you see and your role.',
    tip: 'Signing in can’t approve transactions.',
  },
  {
    id: 'wallet',
    route: AppRoutes.spaces.index,
    anchor: `header ${byTestId('connect-wallet-btn')}, header ${byTestId('open-account-center')}`,
    placement: { side: 'bottom', align: 'end' },
    title: 'Connect a wallet to sign',
    body: 'Connect a Safe signer to approve transactions. It can differ from your sign-in wallet.',
    tip: 'Not needed to look around.',
  },
  {
    id: 'open-safe',
    route: AppRoutes.spaces.safeAccounts,
    anchor: `${byTestId('space-safe-accounts-list')} tbody tr, ${byTestId('safe-accounts-empty')}`,
    emptyState: byTestId('safe-accounts-empty'),
    sidebarItem: sidebarItem('Safe accounts'),
    placement: { side: 'bottom', align: 'start' },
    title: 'Open a Safe to work inside it',
    body: 'The workspace is your overview. Everything for a single Safe lives inside that Safe:',
    inside: [
      { icon: Coins, label: 'Assets', description: 'Tokens and NFTs it holds' },
      { icon: ArrowRightLeft, label: 'Transactions', description: 'Send, sign and execute' },
      { icon: LayoutGrid, label: 'Apps', description: 'Connect dApps and build batches' },
      { icon: TrendingUp, label: 'DeFi', description: 'Positions across protocols' },
      { icon: Settings, label: 'Settings', description: 'Signers, threshold and modules' },
    ],
    tip: 'Click a Safe to open it. The sidebar then shows a way back to the workspace.',
  },
  {
    id: 'workspace-contacts',
    route: AppRoutes.spaces.addressBook,
    selectOnEnter: byTestId('address-book-workspace-tab'),
    anchor: selectedAddressBookTab('address-book-workspace-tab'),
    emptyState: ADDRESS_BOOK_EMPTY,
    sidebarItem: sidebarItem('Address book'),
    placement: { side: 'bottom', align: 'center' },
    title: 'Workspace contacts',
    body: 'Address book entries everyone in the workspace can see.',
    tip: 'Admins edit them. Members propose new ones.',
  },
  {
    id: 'local-contacts',
    route: AppRoutes.spaces.addressBook,
    selectOnEnter: byTestId('address-book-local-tab'),
    anchor: selectedAddressBookTab('address-book-local-tab'),
    emptyState: ADDRESS_BOOK_EMPTY,
    sidebarItem: sidebarItem('Address book'),
    placement: { side: 'bottom', align: 'center' },
    title: 'Local contacts',
    body: 'Only you see these, and only in this browser.',
    tip: 'Use "Add to Workspace" to share one.',
  },
  {
    id: 'replay',
    route: AppRoutes.spaces.settingsGeneral,
    anchor: byTestId('settings-take-tour'),
    sidebarItem: sidebarItem('Settings'),
    placement: { side: 'bottom', align: 'end' },
    title: 'Take the tour again',
    body: 'Replay it anytime from Settings.',
  },
]

export const TOUR_NEXT_ACTIONS: TourNextActionLink[] = [
  {
    icon: WalletCards,
    label: 'Add a Safe account',
    description: 'Bring in an existing Safe',
    route: AppRoutes.spaces.safeAccounts,
  },
  { icon: UsersRound, label: 'Invite your team', description: 'Add your co-signers', route: AppRoutes.spaces.members },
]
