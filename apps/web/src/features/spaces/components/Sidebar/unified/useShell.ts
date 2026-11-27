import { useCallback, useMemo, useSyncExternalStore } from 'react'
import { useRouter } from 'next/router'
import { useSafeQueryParam } from '@/hooks/useSafeAddressFromUrl'
import {
  findMockSafe,
  getMockWorkspaces,
  getSafeName,
  isInWorkspace,
  type MockSafe,
  type MockWorkspace,
} from './fixtures'
import { useScenario, type Context, type Role, type Scenario } from './scenario'
import {
  getPickSafeHref,
  getShellLink,
  getShellPageKey,
  type ShellContext,
  type ShellLink,
  type ShellPageKey,
} from './shellPages'

/** What to do once the user says which Safe: open a page, or start a send. */
export type SafeRequest = { page: ShellPageKey; label: string; thenSend?: boolean }

// The app bar and the sidebar sit in separate trees, so the open request lives outside React.
let safeRequest: SafeRequest | null = null
const listeners = new Set<() => void>()
const setSafeRequest = (next: SafeRequest | null) => {
  safeRequest = next
  listeners.forEach((listener) => listener())
}
const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export const useSafeRequest = (): [SafeRequest | null, (next: SafeRequest | null) => void] => [
  useSyncExternalStore(
    subscribe,
    () => safeRequest,
    () => null,
  ),
  setSafeRequest,
]

export type Shell = {
  scenario: Scenario
  role: Role
  workspaces: MockWorkspace[]
  workspace: MockWorkspace
  isWorkspace: boolean
  hasPro: boolean
  /** The picked Safe as `<chain>:<address>`, or undefined for All Safes. */
  safe: string | undefined
  /** The picked Safe with its mock details. A Safe outside the scenario has a name and nothing else. */
  pickedSafe: MockSafe | undefined
  /** All Safes is on offer: a Workspace always has it, My accounts once there are several Safes. */
  hasAllSafes: boolean
  pageKey: ShellPageKey | undefined
  context: ShellContext
  getLink: (key: ShellPageKey) => ShellLink
  /** Opens a Safe, or All Safes with `null`, in the given workspace. Returns once the page has changed. */
  pickSafe: (target: Context, safe: string | null, page?: ShellPageKey) => Promise<boolean>
}

/** Everything the app bar and the sidebar need: the open workspace, the picked Safe and where items go. */
export const useShell = (): Shell => {
  const [scenario, update] = useScenario()
  const router = useRouter()
  const safe = useSafeQueryParam() || undefined
  const { pathname, query } = router

  const workspaces = useMemo(() => getMockWorkspaces(scenario), [scenario])
  const isWorkspace = isInWorkspace(scenario)
  const workspace = workspaces.find((w) => w.context === (isWorkspace ? 'workspace' : 'accounts')) ?? workspaces[0]
  const hasPro = workspace.summary.hasPro
  const pageKey = getShellPageKey(pathname, query.feature)
  const context = useMemo<ShellContext>(() => ({ isWorkspace, hasPro, safe }), [isWorkspace, hasPro, safe])

  const pickedSafe = useMemo<MockSafe | undefined>(() => {
    if (!safe) return undefined
    return findMockSafe(safe) ?? { name: getSafeName(safe), safe, threshold: 0, owners: 0, balance: Number.NaN }
  }, [safe])

  const getLink = useCallback((key: ShellPageKey) => getShellLink(key, context), [context])

  const pickSafe = useCallback(
    (target: Context, nextSafe: string | null, page?: ShellPageKey) => {
      const next = workspaces.find((w) => w.context === target) ?? workspaces[0]
      if (next.context !== scenario.context) update({ context: next.context })
      return router.push(
        getPickSafeHref(page ?? pageKey, {
          isWorkspace: next.context === 'workspace',
          hasPro: next.summary.hasPro,
          safe: nextSafe ?? undefined,
        }),
      )
    },
    [workspaces, scenario.context, update, router, pageKey],
  )

  return {
    scenario,
    role: scenario.role,
    workspaces,
    workspace,
    isWorkspace,
    hasPro,
    safe,
    pickedSafe,
    hasAllSafes: isWorkspace || workspace.safes.length > 1,
    pageKey,
    context,
    getLink,
    pickSafe,
  }
}
