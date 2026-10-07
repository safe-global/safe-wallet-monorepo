import type { ReactNode } from 'react'
import { faker } from '@faker-js/faker'
import { http, HttpResponse } from 'msw'
import { GATEWAY_URL } from '@/config/gateway'
import { server } from '@/tests/server'
import { act, renderHook, waitFor } from '@/tests/test-utils'
import { SafeScopeProvider } from '@/components/tx-flow/safe-scope/SafeScopeProvider'
import { Severity, SafeStatus } from '@safe-global/utils/features/safe-shield/types'
import type { RootState } from '@/store'
import { extendedSafeInfoBuilder } from '@/tests/builders/safe'
import useUntrustedSafeAnalysis from '../useUntrustedSafeAnalysis'

const safe = extendedSafeInfoBuilder().build()
const safeAddress = safe.address.value
const chainId = safe.chainId

const loadedSafeState = { safeInfo: { data: safe, loaded: true, loading: false } } as unknown as Partial<RootState>

const renderAnalysis = (initialReduxState?: Partial<RootState>) =>
  renderHook(() => useUntrustedSafeAnalysis(), { initialReduxState })

const spaceId = faker.string.uuid()

const signedInState = {
  ...loadedSafeState,
  auth: {
    sessionExpiresAt: Date.now() + 60_000,
    landingSpaceHint: null,
    isStoreHydrated: true,
    cfSafeSynced: false,
    isOidcLoginPending: false,
    isSessionCheckPending: false,
  },
} as unknown as Partial<RootState>

const respondWithSpaceSafes = (safes: Record<string, string[]>) => {
  const requests = { count: 0 }
  server.use(
    http.get(`${GATEWAY_URL}/v1/spaces/${spaceId}/safes`, () => {
      requests.count += 1
      return HttpResponse.json({ safes })
    }),
  )
  return requests
}

const renderAnalysisInSpace = () =>
  renderHook(() => useUntrustedSafeAnalysis(), {
    routerProps: { query: { spaceId } },
    initialReduxState: signedInState,
  })

describe('useUntrustedSafeAnalysis', () => {
  it('returns no analysis while no Safe is available', () => {
    const { result } = renderAnalysis()

    expect(result.current.safeAnalysis).toBeNull()
  })

  it('returns no analysis while the selected Safe is still loading', () => {
    const { result } = renderAnalysis({
      safeInfo: { data: undefined, loaded: false, loading: true },
    } as unknown as Partial<RootState>)

    expect(result.current.safeAnalysis).toBeNull()
  })

  it('flags a loaded Safe that is not in the user accounts', () => {
    const { result } = renderAnalysis(loadedSafeState)

    expect(result.current.safeAnalysis).toEqual({
      severity: Severity.CRITICAL,
      type: SafeStatus.UNTRUSTED,
      title: 'Not in your accounts',
      description: expect.any(String),
    })
  })

  it('returns no analysis for a pinned Safe', () => {
    const { result } = renderAnalysis({
      ...loadedSafeState,
      addedSafes: { [chainId]: { [safeAddress]: { owners: safe.owners, threshold: safe.threshold } } },
    } as unknown as Partial<RootState>)

    expect(result.current.safeAnalysis).toBeNull()
  })

  it('returns no analysis for a Safe in the current Workspace', async () => {
    respondWithSpaceSafes({ [chainId]: [safeAddress] })

    const { result } = renderAnalysisInSpace()

    await waitFor(() => expect(result.current.safeAnalysis).toBeNull())
  })

  it('flags a Safe that is not in the current Workspace', async () => {
    const requests = respondWithSpaceSafes({ [chainId]: [faker.finance.ethereumAddress()] })

    const { result } = renderAnalysisInSpace()

    await waitFor(() => expect(requests.count).toBe(1))
    await act(() => new Promise((resolve) => setTimeout(resolve, 50)))
    expect(result.current.safeAnalysis?.type).toBe(SafeStatus.UNTRUSTED)
  })

  it('ignores the Safe left in Redux while a Space flow has not picked one', () => {
    const wrapper = ({ children }: { children: ReactNode }) => <SafeScopeProvider>{children}</SafeScopeProvider>
    const { result } = renderHook(() => useUntrustedSafeAnalysis(), { wrapper, initialReduxState: loadedSafeState })

    expect(result.current.safeAnalysis).toBeNull()
  })
})
