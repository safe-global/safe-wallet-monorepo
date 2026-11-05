import { useMemo, useState, type ReactElement } from 'react'
import type { NextRouter } from 'next/router'
import { RouterContext } from 'next/dist/shared/lib/router-context.shared-runtime'
import { http, HttpResponse } from 'msw'
import { faker } from '@faker-js/faker'
import { act, renderWithUserEvent, screen, waitFor } from '@/tests/test-utils'
import { server } from '@/tests/server'
import { GATEWAY_URL } from '@/config/gateway'
import { AppRoutes } from '@/config/routes'
import { WalletContext } from '@/components/common/WalletProvider'
import { useRouterGuard } from '@/hooks/useRouterGuard'
import { useFlowActivationGuard } from '@/hooks/useRouterGuard/activationGuards/useFlowActivationGuard'
import CreateSpaceOnboarding from './index'

jest.mock('@/hooks/useIsSafeProEnabled', () => ({ useIsSafeProEnabled: () => true }))

type Location = { pathname: string; query: Record<string, string> }
type Url = string | { pathname?: string; query?: Record<string, string> }

const toLocation = (url: Url, current: Location): Location => {
  if (typeof url !== 'string') return { pathname: url.pathname ?? current.pathname, query: url.query ?? {} }
  const parsed = new URL(url, 'http://localhost')
  return { pathname: parsed.pathname, query: Object.fromEntries(parsed.searchParams) }
}

let currentLocation: Location
let setWalletReady: (isReady: boolean) => void

const GuardedPage = (): ReactElement => {
  useRouterGuard({ useGuard: useFlowActivationGuard })
  return <CreateSpaceOnboarding />
}

const App = ({ initialPath }: { initialPath: string }): ReactElement => {
  const [location, setLocation] = useState<Location>(() => {
    window.history.replaceState(null, '', initialPath)
    return { pathname: initialPath, query: {} }
  })
  const [isWalletReady, setIsWalletReady] = useState(false)
  currentLocation = location
  setWalletReady = setIsWalletReady

  const router = useMemo<NextRouter>(() => {
    const navigate = (url: Url) => {
      setLocation((current) => {
        const next = toLocation(url, current)
        window.history.replaceState(null, '', `${next.pathname}?${new URLSearchParams(next.query)}`)
        return next
      })
      return Promise.resolve(true)
    }
    return {
      route: location.pathname,
      pathname: location.pathname,
      query: location.query,
      asPath: `${location.pathname}?${new URLSearchParams(location.query)}`,
      basePath: '',
      isReady: true,
      isFallback: false,
      isLocaleDomain: false,
      isPreview: false,
      push: navigate,
      replace: navigate,
      reload: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      prefetch: jest.fn(() => Promise.resolve()),
      beforePopState: jest.fn(),
      events: { on: jest.fn(), off: jest.fn(), emit: jest.fn() },
    }
  }, [location])

  const wallet = useMemo(
    () => ({ connectedWallet: null, signer: null, setSignerAddress: jest.fn(), isReady: isWalletReady }),
    [isWalletReady],
  )

  return (
    <RouterContext.Provider value={router}>
      <WalletContext.Provider value={wallet}>
        <GuardedPage key={location.pathname} />
      </WalletContext.Provider>
    </RouterContext.Provider>
  )
}

const signedInState = {
  auth: {
    sessionExpiresAt: Date.now() + 60 * 60 * 1000,
    landingSpaceHint: null,
    isStoreHydrated: true,
    cfSafeSynced: true,
    isOidcLoginPending: false,
    isSessionCheckPending: false,
  },
}

const serveWorkspacesBackend = (userId: number) => {
  const workspaces: Array<{ uuid: string; name: string }> = []
  const members = [{ id: 1, role: 'ADMIN', status: 'ACTIVE', name: 'Owner', invitedBy: null, user: { id: userId } }]
  const workspaceDto = (workspace: { uuid: string; name: string }) => ({
    ...workspace,
    id: 1,
    status: 'ACTIVE',
    members,
    memberCount: 1,
    safeCount: 0,
  })
  server.use(
    http.get(`${GATEWAY_URL}/v1/spaces`, () => HttpResponse.json(workspaces.map(workspaceDto))),
    http.post<never, { name: string }>(`${GATEWAY_URL}/v1/spaces`, async ({ request }) => {
      const workspace = { uuid: faker.string.uuid(), name: (await request.json()).name }
      workspaces.push(workspace)
      return HttpResponse.json(workspace, { status: 201 })
    }),
    http.get<{ spaceId: string }>(`${GATEWAY_URL}/v1/spaces/:spaceId`, ({ params }) => {
      const workspace = workspaces.find(({ uuid }) => uuid === params.spaceId)
      return workspace ? HttpResponse.json(workspaceDto(workspace)) : new HttpResponse(null, { status: 404 })
    }),
    http.get(`${GATEWAY_URL}/v1/spaces/:spaceId/members`, () => HttpResponse.json({ members })),
    http.get(`${GATEWAY_URL}/v1/spaces/:spaceId/safes`, () => HttpResponse.json({ safes: {} })),
    http.get(`${GATEWAY_URL}/v1/users`, () => HttpResponse.json({ id: userId, status: 'ACTIVE', wallets: [] })),
    http.get(`${GATEWAY_URL}/v1/billing/spaces/:spaceId/*`, () => new Promise<never>(() => {})),
  )
  return workspaces
}

describe('CreateSpaceOnboarding under the router guard', () => {
  it('keeps the created Workspace in the wizard when the wallet becomes ready during the trial check', async () => {
    const workspaceName = faker.company.name().slice(0, 20)
    const workspaces = serveWorkspacesBackend(faker.number.int({ min: 1, max: 1000 }))
    const { user } = renderWithUserEvent(<App initialPath={AppRoutes.welcome.createSpace} />, {
      initialReduxState: signedInState,
    })
    const nameInput = await screen.findByRole('textbox', { name: 'Workspace name' })
    await waitFor(() => expect(nameInput).toBeEnabled())

    await user.type(nameInput, workspaceName)
    await user.click(screen.getByRole('button', { name: 'Next' }))
    await waitFor(() => expect(workspaces).toHaveLength(1))
    act(() => setWalletReady(true))

    await waitFor(() =>
      expect(currentLocation).toEqual({
        pathname: AppRoutes.welcome.createSpace,
        query: { spaceId: workspaces[0].uuid },
      }),
    )
    expect(screen.getByRole('textbox', { name: 'Workspace name' })).toHaveValue(workspaceName)
  })
})
