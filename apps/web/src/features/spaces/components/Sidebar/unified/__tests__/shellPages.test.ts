import { AppRoutes } from '@/config/routes'
import { MOCK_SPACE_ID } from '../fixtures'
import { isShellRoute } from '../useIsUnifiedShell'
import {
  FREE_DEFI,
  FREE_MAIN,
  getIntendedUrl,
  getPickSafeHref,
  getShellLink,
  getShellPageKey,
  PREVIEW_ROUTE,
  SHELL_PAGES,
  type ShellContext,
  type ShellPageKey,
} from '../shellPages'

const SAFE = 'sep:0x0000000000000000000000000000000000000001'

const free = (safe?: string): ShellContext => ({ isWorkspace: false, hasPro: false, safe })
const pro = (safe?: string): ShellContext => ({ isWorkspace: true, hasPro: true, safe })
const lapsed = (safe?: string): ShellContext => ({ isWorkspace: true, hasPro: false, safe })

const SAFE_PAGES: [ShellPageKey, string][] = [
  ['overview', '/home'],
  ['assets', '/balances'],
  ['transactions', '/transactions/history'],
  ['earn', '/earn'],
  ['addressBook', '/address-book'],
  ['apps', '/apps'],
  ['settings', '/settings/setup'],
  ['swap', '/swap'],
  ['bridge', '/bridge'],
  ['stake', '/stake'],
]

describe('Free keeps today', () => {
  it('lists the items in the production order with the production labels', () => {
    expect(FREE_MAIN.map((key) => SHELL_PAGES[key].label)).toEqual([
      'Overview',
      'Assets',
      'Transactions',
      'Address book',
      'Apps',
      'Settings',
    ])
    expect(FREE_DEFI.map((key) => SHELL_PAGES[key].label)).toEqual(['Swap', 'Bridge', 'Earn', 'Stake'])
  })
})

describe('getShellLink with a Safe picked', () => {
  it.each(SAFE_PAGES)('%s opens the existing Safe URL on Free', (key, pathname) => {
    expect(getShellLink(key, free(SAFE))).toEqual({ kind: 'page', href: { pathname, query: { safe: SAFE } } })
  })

  it.each(SAFE_PAGES)('%s opens the same URL plus spaceId in a Workspace', (key, pathname) => {
    expect(getShellLink(key, pro(SAFE))).toEqual({
      kind: 'page',
      href: { pathname, query: { safe: SAFE, spaceId: MOCK_SPACE_ID } },
    })
  })

  it('keeps every Safe page open when the trial has ended', () => {
    SAFE_PAGES.forEach(([key, pathname]) => {
      const link = getShellLink(key, lapsed(SAFE))
      expect(link).toMatchObject({ kind: 'page', href: { pathname } })
    })
  })

  it('narrows a Workspace page to the Safe with the prototype-only safe param', () => {
    expect(getShellLink('policies', pro(SAFE))).toEqual({
      kind: 'page',
      href: { pathname: '/spaces/policies', query: { spaceId: MOCK_SPACE_ID, safe: SAFE } },
    })
  })

  it('never filters Members, Plan, Workspace settings or Manage Safes by Safe', () => {
    const keys: ShellPageKey[] = ['members', 'plan', 'workspaceSettings', 'safeAccounts']
    keys.forEach((key) => {
      const link = getShellLink(key, pro(SAFE))
      expect(link).toMatchObject({ kind: 'page', href: { query: { spaceId: MOCK_SPACE_ID } } })
      expect(link.kind === 'page' && 'safe' in link.href.query).toBe(false)
    })
  })

  it('opens a read-only preview for Workspace pages on Free and after the trial', () => {
    expect(getShellLink('policies', free(SAFE))).toEqual({
      kind: 'preview',
      href: { pathname: PREVIEW_ROUTE, query: { feature: 'policies', safe: SAFE } },
    })
    expect(getShellLink('activity', lapsed(SAFE)).kind).toBe('preview')
  })

  it('shows a placeholder for Reports, which has no route', () => {
    expect(getShellLink('reports', pro(SAFE))).toEqual({
      kind: 'placeholder',
      href: { pathname: PREVIEW_ROUTE, query: { feature: 'reports', safe: SAFE, spaceId: MOCK_SPACE_ID } },
    })
  })
})

describe('getShellLink with All Safes', () => {
  it('opens the existing Workspace pages', () => {
    const query = { spaceId: MOCK_SPACE_ID }
    expect(getShellLink('overview', pro())).toEqual({ kind: 'page', href: { pathname: '/spaces', query } })
    expect(getShellLink('transactions', pro())).toEqual({
      kind: 'page',
      href: { pathname: '/spaces/transactions', query },
    })
    expect(getShellLink('addressBook', pro())).toEqual({
      kind: 'page',
      href: { pathname: '/spaces/address-book', query },
    })
  })

  it('shows a placeholder for Workspace Assets and Treasury, which have no route', () => {
    expect(getShellLink('assets', pro()).kind).toBe('placeholder')
    expect(getShellLink('earn', pro()).kind).toBe('placeholder')
  })

  it('asks which Safe for pages that need one', () => {
    expect(getShellLink('swap', pro())).toEqual({ kind: 'pickSafe' })
    expect(getShellLink('apps', free())).toEqual({ kind: 'pickSafe' })
    expect(getShellLink('addressBook', free())).toEqual({ kind: 'pickSafe' })
  })

  it('opens the free account list for Overview on Free, and previews for views across Safes', () => {
    expect(getShellLink('overview', free())).toEqual({
      kind: 'page',
      href: { pathname: '/welcome/accounts', query: {} },
    })
    expect(getShellLink('assets', free()).kind).toBe('preview')
    expect(getShellLink('transactions', free()).kind).toBe('preview')
    expect(getShellLink('earn', free()).kind).toBe('preview')
  })

  it('never links to a route that is missing from routes.ts', () => {
    const known = new Set<string>([PREVIEW_ROUTE])
    const collect = (value: unknown) => {
      if (typeof value === 'string') known.add(value)
      else if (value && typeof value === 'object') Object.values(value).forEach(collect)
    }
    collect(AppRoutes)
    const keys = Object.keys(SHELL_PAGES) as ShellPageKey[]
    ;[free(), free(SAFE), pro(), pro(SAFE), lapsed(), lapsed(SAFE)].forEach((context) => {
      keys.forEach((key) => {
        const link = getShellLink(key, context)
        if (link.kind !== 'pickSafe') expect(known.has(link.href.pathname)).toBe(true)
      })
    })
  })
})

describe('getPickSafeHref', () => {
  it('keeps the current page when picking another Safe', () => {
    expect(getPickSafeHref('transactions', free(SAFE))).toEqual({
      pathname: '/transactions/history',
      query: { safe: SAFE },
    })
    expect(getPickSafeHref('policies', pro(SAFE))).toMatchObject({ pathname: '/spaces/policies' })
  })

  it('keeps the current page for All Safes in a Workspace, and opens Overview from a page that needs one Safe', () => {
    expect(getPickSafeHref('transactions', pro())).toMatchObject({ pathname: '/spaces/transactions' })
    expect(getPickSafeHref('swap', pro())).toMatchObject({ pathname: '/spaces' })
  })

  it('opens Overview when the page does not exist for the pick', () => {
    expect(getPickSafeHref('members', pro(SAFE))).toMatchObject({ pathname: '/home' })
    expect(getPickSafeHref('policies', free(SAFE))).toMatchObject({ pathname: '/home' })
    expect(getPickSafeHref(undefined, free(SAFE))).toMatchObject({ pathname: '/home' })
  })

  it('opens the free account list for All Safes in My accounts', () => {
    expect(getPickSafeHref('transactions', free())).toEqual({ pathname: '/welcome/accounts', query: {} })
  })
})

describe('getShellPageKey', () => {
  it.each([
    ['/home', 'overview'],
    ['/balances/nfts', 'assets'],
    ['/transactions/queue', 'transactions'],
    ['/settings/security', 'settings'],
    ['/apps/custom', 'apps'],
    ['/spaces', 'overview'],
    ['/spaces/settings/general', 'workspaceSettings'],
    ['/spaces/transactions', 'transactions'],
    ['/welcome/accounts', 'overview'],
  ])('%s is %s', (pathname, key) => {
    expect(getShellPageKey(pathname)).toBe(key)
  })

  it('reads the stand-in page from its feature param', () => {
    expect(getShellPageKey(PREVIEW_ROUTE, 'reports')).toBe('reports')
    expect(getShellPageKey(PREVIEW_ROUTE, 'nope')).toBeUndefined()
  })

  it('has no item for a URL outside the list', () => {
    expect(getShellPageKey('/wc')).toBeUndefined()
  })
})

describe('getIntendedUrl', () => {
  it('names the proposed route and the Safe filter', () => {
    expect(getIntendedUrl('reports', { safe: SAFE })).toBe(`/spaces/reports?spaceId=…&safe=${SAFE}`)
    expect(getIntendedUrl('members', { safe: SAFE })).toBe('/spaces/members?spaceId=…')
    expect(getIntendedUrl('swap', { safe: SAFE })).toBeUndefined()
  })
})

describe('isShellRoute', () => {
  it('wraps Safe pages, Workspace pages, the account list and the stand-ins', () => {
    expect(isShellRoute('/home', true)).toBe(true)
    expect(isShellRoute('/transactions/tx', true)).toBe(true)
    expect(isShellRoute('/spaces/policies', false)).toBe(true)
    expect(isShellRoute('/welcome/accounts', false)).toBe(true)
    expect(isShellRoute(PREVIEW_ROUTE, false)).toBe(true)
  })

  it('leaves onboarding, Safe creation and pages without a Safe alone', () => {
    expect(isShellRoute('/welcome/spaces', false)).toBe(false)
    expect(isShellRoute('/new-safe/create', true)).toBe(false)
    expect(isShellRoute('/spaces/create-space', false)).toBe(false)
    expect(isShellRoute('/settings/cookies', false)).toBe(false)
  })
})
