import type { ComponentType } from 'react'
import {
  ArrowRightLeft,
  BookUser,
  Coins,
  Database,
  FileText,
  History,
  Landmark,
  LayoutGrid,
  ListChecks,
  Orbit,
  Repeat2,
  Settings,
  Shield,
  TrendingUp,
  UsersRound,
  Wallet,
  WalletCards,
} from 'lucide-react'
import { AppRoutes } from '@/config/routes'
import { MOCK_SPACE_ID } from './fixtures'

export const PREVIEW_ROUTE = '/prototypes/pro-preview'

export type ShellPageKey =
  | 'overview'
  | 'assets'
  | 'transactions'
  | 'earn'
  | 'addressBook'
  | 'apps'
  | 'settings'
  | 'swap'
  | 'bridge'
  | 'stake'
  | 'policies'
  | 'reports'
  | 'security'
  | 'activity'
  | 'members'
  | 'plan'
  | 'workspaceSettings'
  | 'safeAccounts'

/** How a page reacts to the picked Safe. `workspace` narrows a Workspace page to it, `workspaceOnly` never does. */
export type ShellPageScope = 'follows' | 'ignores' | 'oneSafe' | 'workspace' | 'workspaceOnly'

export type ShellPage = {
  key: ShellPageKey
  label: string
  icon: ComponentType<{ className?: string }>
  scope: ShellPageScope
  safeRoute?: string
  workspaceRoute?: string
  /** No page in code yet. A guess for developers to confirm, never linked to. */
  proposedRoute?: string
  /** Locked-item copy: what it does, an example with the user's own Safe, and the read-only preview rows. */
  what?: string
  example?: (safeName: string) => string
  preview?: string[]
}

export const SHELL_PAGES: Record<ShellPageKey, ShellPage> = {
  overview: {
    key: 'overview',
    label: 'Overview',
    icon: Wallet,
    scope: 'follows',
    safeRoute: AppRoutes.home,
    workspaceRoute: AppRoutes.spaces.index,
  },
  assets: {
    key: 'assets',
    label: 'Assets',
    icon: Coins,
    scope: 'follows',
    safeRoute: AppRoutes.balances.index,
    proposedRoute: '/spaces/assets',
    what: 'Every token and position across your Safes, in one table.',
    example: (safe) => `See what ${safe} holds next to your other Safes, with a network column.`,
    preview: ['Tokens, positions and NFTs', 'A Safe and a network column', 'One total across your Safes'],
  },
  transactions: {
    key: 'transactions',
    label: 'Transactions',
    icon: ArrowRightLeft,
    scope: 'follows',
    safeRoute: AppRoutes.transactions.history,
    workspaceRoute: AppRoutes.spaces.transactions,
    what: 'Everything waiting for a signature across your Safes, in one queue.',
    example: (safe) => `See what is waiting on ${safe} and your other Safes without opening each one.`,
    preview: ['Pending across every Safe and network', 'Filter by Safe, network and signer', 'Sign from the list'],
  },
  earn: {
    key: 'earn',
    label: 'Earn',
    icon: TrendingUp,
    scope: 'follows',
    safeRoute: AppRoutes.earn,
    proposedRoute: '/spaces/treasury',
    what: 'Idle cash and deposits across your Safes, with one place to act on them.',
    example: (safe) => `See how much of ${safe} is idle and deposit it from the same page.`,
    preview: ['Idle and deposited, across your Safes', 'Your deposits and where they are', 'Deposit from any Safe'],
  },
  addressBook: {
    key: 'addressBook',
    label: 'Address book',
    icon: BookUser,
    scope: 'ignores',
    safeRoute: AppRoutes.addressBook,
    workspaceRoute: AppRoutes.spaces.addressBook,
  },
  apps: { key: 'apps', label: 'Apps', icon: LayoutGrid, scope: 'oneSafe', safeRoute: AppRoutes.apps.index },
  settings: {
    key: 'settings',
    label: 'Settings',
    icon: Settings,
    scope: 'oneSafe',
    safeRoute: AppRoutes.settings.setup,
  },
  swap: { key: 'swap', label: 'Swap', icon: Repeat2, scope: 'oneSafe', safeRoute: AppRoutes.swap },
  bridge: { key: 'bridge', label: 'Bridge', icon: Orbit, scope: 'oneSafe', safeRoute: AppRoutes.bridge },
  stake: { key: 'stake', label: 'Stake', icon: Database, scope: 'oneSafe', safeRoute: AppRoutes.stake },
  policies: {
    key: 'policies',
    label: 'Policies',
    icon: Landmark,
    scope: 'workspace',
    workspaceRoute: AppRoutes.spaces.policies,
    what: 'Rules your Safes follow before anything is sent.',
    example: (safe) => `Let ${safe} send up to 10,000 USDC a day to known addresses, and flag the rest.`,
    preview: ['Spending limits per token and period', 'Allowlists for recipients', 'Who can propose transactions'],
  },
  reports: {
    key: 'reports',
    label: 'Reports',
    icon: FileText,
    scope: 'workspace',
    proposedRoute: '/spaces/reports',
    what: 'Statements for a period, across your Safes, ready to export.',
    example: (safe) => `Export what ${safe} received and sent last quarter as one statement.`,
    preview: ['Statements by period', 'One Safe or all of them', 'Export for your accountant'],
  },
  security: {
    key: 'security',
    label: 'Security hub',
    icon: Shield,
    scope: 'workspace',
    workspaceRoute: AppRoutes.spaces.security,
    what: 'Security checks for all your Safes in one place.',
    example: (safe) => `Get told when ${safe} has an outdated module or a risky signer setup.`,
    preview: ['Setup checks per Safe', 'A report for each Safe', 'Workspace sign-in checks'],
  },
  activity: {
    key: 'activity',
    label: 'Activity',
    icon: History,
    scope: 'workspace',
    workspaceRoute: AppRoutes.spaces.activity,
    what: 'A record of who did what in your Workspace, and when.',
    example: (safe) => `See who changed the ${safe} signers last week.`,
    preview: ['Member and Safe changes', 'Filter by person and date', 'Export for audits'],
  },
  members: {
    key: 'members',
    label: 'Members',
    icon: UsersRound,
    scope: 'workspaceOnly',
    workspaceRoute: AppRoutes.spaces.members,
    what: 'Invite your team, with admin and member roles.',
    example: (safe) => `Give your finance lead a view of ${safe} without making them a signer.`,
    preview: ['Admin and member roles', 'Invite by email or wallet', 'Unlimited members'],
  },
  plan: {
    key: 'plan',
    label: 'Plan',
    icon: ListChecks,
    scope: 'workspaceOnly',
    workspaceRoute: AppRoutes.spaces.plans,
    what: 'Your plan, your trial and billing.',
    example: () => 'Start a 30-day trial. No card needed, and nothing changes for your Safes.',
    preview: ['Free, Starter, Business and Enterprise', 'Compare features', 'Billing for admins'],
  },
  workspaceSettings: {
    key: 'workspaceSettings',
    label: 'Workspace settings',
    icon: Settings,
    scope: 'workspaceOnly',
    workspaceRoute: AppRoutes.spaces.settings,
  },
  safeAccounts: {
    key: 'safeAccounts',
    label: 'Manage Safes',
    icon: WalletCards,
    scope: 'workspaceOnly',
    workspaceRoute: AppRoutes.spaces.safeAccounts,
  },
}

export const isWorkspacePage = ({ scope }: ShellPage): boolean => scope === 'workspace' || scope === 'workspaceOnly'

/** Today's Free order and labels, then the locked Workspace group. */
export const FREE_MAIN: ShellPageKey[] = ['overview', 'assets', 'transactions', 'addressBook', 'apps', 'settings']
export const FREE_DEFI: ShellPageKey[] = ['swap', 'bridge', 'earn', 'stake']
export const FREE_WORKSPACE: ShellPageKey[] = ['policies', 'reports']
/** One row on Free, so the locked group stays at three rows. */
export const FREE_WORKSPACE_COMBINED: ShellPageKey[] = ['security', 'activity']

export const PRO_MAIN: ShellPageKey[] = ['overview', 'assets', 'transactions', 'earn', 'addressBook']
export const PRO_WORKSPACE: ShellPageKey[] = ['policies', 'reports', 'security', 'activity']
export const PRO_THIS_SAFE: ShellPageKey[] = ['apps', 'swap', 'bridge', 'stake', 'settings']
export const SWITCHER_PAGES: ShellPageKey[] = ['members', 'plan', 'workspaceSettings', 'safeAccounts']

const PATH_PREFIXES: [string, ShellPageKey][] = [
  [AppRoutes.spaces.transactions, 'transactions'],
  [AppRoutes.spaces.addressBook, 'addressBook'],
  [AppRoutes.spaces.policies, 'policies'],
  [AppRoutes.spaces.security, 'security'],
  [AppRoutes.spaces.activity, 'activity'],
  [AppRoutes.spaces.members, 'members'],
  [AppRoutes.spaces.plans, 'plan'],
  [AppRoutes.spaces.settings, 'workspaceSettings'],
  [AppRoutes.spaces.safeAccounts, 'safeAccounts'],
  [AppRoutes.home, 'overview'],
  [AppRoutes.balances.index, 'assets'],
  [AppRoutes.transactions.index, 'transactions'],
  [AppRoutes.earn, 'earn'],
  [AppRoutes.addressBook, 'addressBook'],
  [AppRoutes.apps.index, 'apps'],
  [AppRoutes.settings.index, 'settings'],
  [AppRoutes.swap, 'swap'],
  [AppRoutes.bridge, 'bridge'],
  [AppRoutes.stake, 'stake'],
]

export const isShellPageKey = (value: unknown): value is ShellPageKey =>
  typeof value === 'string' && Object.hasOwn(SHELL_PAGES, value)

/** The page a URL shows, or undefined for a URL the shell has no item for (a transaction link still opens). */
export const getShellPageKey = (pathname: string, feature?: unknown): ShellPageKey | undefined => {
  if (pathname === PREVIEW_ROUTE) return isShellPageKey(feature) ? feature : undefined
  if (pathname === AppRoutes.spaces.index || pathname === AppRoutes.welcome.accounts) return 'overview'
  return PATH_PREFIXES.find(([prefix]) => pathname === prefix || pathname.startsWith(`${prefix}/`))?.[1]
}

export type ShellHref = { pathname: string; query: Record<string, string> }

export type ShellContext = {
  /** The Workspace is open, not My accounts. */
  isWorkspace: boolean
  /** The open workspace's plan includes the Workspace pages. */
  hasPro: boolean
  /** The picked Safe as `<chain>:<address>`, or undefined for All Safes. */
  safe: string | undefined
}

export type ShellLink =
  /** An existing page, at its existing URL. */
  | { kind: 'page'; href: ShellHref }
  /** No route in code yet: a stand-in that names the proposed one. */
  | { kind: 'placeholder'; href: ShellHref }
  /** Not on the plan: a read-only preview with the trial offer. */
  | { kind: 'preview'; href: ShellHref }
  /** Needs exactly one Safe and none is picked. */
  | { kind: 'pickSafe' }

const standIn = (key: ShellPageKey, { isWorkspace, safe }: ShellContext): ShellHref => ({
  pathname: PREVIEW_ROUTE,
  query: { feature: key, ...(safe ? { safe } : {}), ...(isWorkspace ? { spaceId: MOCK_SPACE_ID } : {}) },
})

const getWorkspacePageLink = (page: ShellPage, context: ShellContext): ShellLink => {
  if (!context.isWorkspace || !context.hasPro) return { kind: 'preview', href: standIn(page.key, context) }
  if (!page.workspaceRoute) return { kind: 'placeholder', href: standIn(page.key, context) }
  // `&safe=` on a Workspace URL is prototype-only until developers confirm it.
  const safe = page.scope === 'workspace' ? context.safe : undefined
  return {
    kind: 'page',
    href: { pathname: page.workspaceRoute, query: { spaceId: MOCK_SPACE_ID, ...(safe ? { safe } : {}) } },
  }
}

const getAllSafesLink = (page: ShellPage, context: ShellContext): ShellLink => {
  if (page.scope === 'oneSafe') return { kind: 'pickSafe' }
  if (!context.isWorkspace) {
    if (page.key === 'overview') return { kind: 'page', href: { pathname: AppRoutes.welcome.accounts, query: {} } }
    return page.scope === 'follows' ? { kind: 'preview', href: standIn(page.key, context) } : { kind: 'pickSafe' }
  }
  // A view across Safes is a Pro view, apart from the Workspace's own home and contacts.
  const isIncluded = context.hasPro || page.key === 'overview' || page.scope === 'ignores'
  if (!isIncluded) return { kind: 'preview', href: standIn(page.key, context) }
  if (!page.workspaceRoute) return { kind: 'placeholder', href: standIn(page.key, context) }
  return { kind: 'page', href: { pathname: page.workspaceRoute, query: { spaceId: MOCK_SPACE_ID } } }
}

/** Where a nav item goes for the open workspace and the picked Safe. Safe pages keep their existing URL. */
export const getShellLink = (key: ShellPageKey, context: ShellContext): ShellLink => {
  const page = SHELL_PAGES[key]
  if (isWorkspacePage(page)) return getWorkspacePageLink(page, context)
  if (!context.safe || !page.safeRoute) return getAllSafesLink(page, context)
  return {
    kind: 'page',
    href: {
      pathname: page.safeRoute,
      query: { safe: context.safe, ...(context.isWorkspace ? { spaceId: MOCK_SPACE_ID } : {}) },
    },
  }
}

const keepsPage = (page: ShellPage, context: ShellContext): boolean => {
  if (page.scope === 'workspaceOnly') return false
  if (context.safe) return page.scope !== 'workspace' || (context.isWorkspace && context.hasPro)
  return context.isWorkspace && page.scope !== 'oneSafe'
}

/** Where picking a Safe, or All Safes, goes: the current page where it exists for the pick, Overview otherwise. */
export const getPickSafeHref = (current: ShellPageKey | undefined, context: ShellContext): ShellHref => {
  const key = current && keepsPage(SHELL_PAGES[current], context) ? current : 'overview'
  const link = getShellLink(key, context)
  if (link.kind !== 'pickSafe') return link.href
  return { pathname: AppRoutes.welcome.accounts, query: {} }
}

/** The production URL a stand-in stands for, for the note developers read on the page. */
export const getIntendedUrl = (key: ShellPageKey, { safe }: Pick<ShellContext, 'safe'>): string | undefined => {
  const page = SHELL_PAGES[key]
  const route = page.workspaceRoute ?? page.proposedRoute
  if (!route) return undefined
  const filter = safe && page.scope !== 'workspaceOnly' ? `&safe=${safe}` : ''
  return `${route}?spaceId=…${filter}`
}
