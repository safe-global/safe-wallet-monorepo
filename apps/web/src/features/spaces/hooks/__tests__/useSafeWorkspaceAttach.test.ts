import type { NextRouter } from 'next/router'
import { renderHook } from '@/tests/test-utils'
import type { RootState } from '@/store'
import { useSafeWorkspaceAttach } from '../useSafeWorkspaceAttach'

const SPACE_A = '11111111-1111-1111-1111-111111111111'
const SPACE_B = '22222222-2222-2222-2222-222222222222'
const SAFE_ADDRESS = '0x0000000000000000000000000000000000000001'

type AllSpaceSafes = Array<{ spaceUuid: string; safes: Record<string, string[]> }>

const mockAllSpaceSafes = jest.fn<{ currentData?: AllSpaceSafes; isLoading: boolean; isFetching: boolean }, []>()
jest.mock('@safe-global/store/gateway/AUTO_GENERATED/spaces', () => ({
  ...jest.requireActual('@safe-global/store/gateway/AUTO_GENERATED/spaces'),
  useSpaceSafesGetAllV1Query: () => ({ ...mockAllSpaceSafes(), error: undefined, refetch: jest.fn() }),
}))
jest.mock('@/hooks/useIsSafeProEnabled', () => ({ useIsSafeProEnabled: () => false }))
jest.mock('@/hooks/useChainId', () => ({ __esModule: true, default: () => '1' }))
let mockSafeAddress = SAFE_ADDRESS
jest.mock('@/hooks/useSafeAddressFromUrl', () => ({ useSafeAddressFromUrl: () => mockSafeAddress }))

const auth = (overrides: Partial<RootState['auth']> = {}): Partial<RootState> =>
  ({
    auth: {
      sessionExpiresAt: Date.now() + 60_000,
      landingSpaceHint: null,
      isStoreHydrated: true,
      cfSafeSynced: false,
      isOidcLoginPending: false,
      isSessionCheckPending: false,
      ...overrides,
    },
  }) as Partial<RootState>

const inSpaces = (...spaceIds: string[]): AllSpaceSafes =>
  spaceIds.map((spaceUuid) => ({ spaceUuid, safes: { '1': [SAFE_ADDRESS] } }))

const renderAttach = (
  options: { query?: NextRouter['query']; pathname?: string; initialReduxState?: Partial<RootState> } = {},
) => {
  const replace = jest.fn(() => Promise.resolve(true))
  const { rerender } = renderHook(() => useSafeWorkspaceAttach(), {
    initialReduxState: options.initialReduxState ?? auth(),
    routerProps: {
      pathname: options.pathname ?? '/transactions/tx',
      query: options.query ?? { safe: `eth:${SAFE_ADDRESS}`, id: 'multisig_0x1' },
      replace,
    },
  })
  return { replace, rerender }
}

describe('useSafeWorkspaceAttach', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSafeAddress = SAFE_ADDRESS
    mockAllSpaceSafes.mockReturnValue({ currentData: inSpaces(SPACE_A), isLoading: false, isFetching: false })
  })

  it('opens a Safe of one Workspace in it, and keeps the rest of the query', () => {
    const { replace } = renderAttach()

    expect(replace).toHaveBeenCalledWith(
      { pathname: '/transactions/tx', query: { safe: `eth:${SAFE_ADDRESS}`, id: 'multisig_0x1', spaceId: SPACE_A } },
      undefined,
      { shallow: true },
    )
  })

  it('attaches once per visit, so a Workspace that is removed again stays removed', () => {
    const { replace, rerender } = renderAttach()

    rerender()

    expect(replace).toHaveBeenCalledTimes(1)
  })

  it('attaches again when the user leaves the Safe and comes back to it', () => {
    const { replace, rerender } = renderAttach()

    mockSafeAddress = ''
    rerender()
    mockSafeAddress = SAFE_ADDRESS
    rerender()

    expect(replace).toHaveBeenCalledTimes(2)
  })

  it('leaves a URL that already has a Workspace alone', () => {
    const { replace } = renderAttach({ query: { safe: `eth:${SAFE_ADDRESS}`, spaceId: SPACE_B } })

    expect(replace).not.toHaveBeenCalled()
  })

  it('does nothing for a signed-out user', () => {
    const { replace } = renderAttach({ initialReduxState: auth({ sessionExpiresAt: null }) })

    expect(replace).not.toHaveBeenCalled()
  })

  // makeStore marks the session settled on load, so a step-up stands for a pending session
  it.each(['leaving', 'returning'] as const)('waits while a step-up is %s', (phase) => {
    const { replace } = renderAttach({ initialReduxState: { ...auth(), stepUp: { phase } } as Partial<RootState> })

    expect(replace).not.toHaveBeenCalled()
  })

  it('waits while the Safes of the Workspaces load', () => {
    mockAllSpaceSafes.mockReturnValue({ currentData: undefined, isLoading: true, isFetching: true })

    const { replace } = renderAttach()

    expect(replace).not.toHaveBeenCalled()
  })

  it('leaves a Safe of several Workspaces to the chooser', () => {
    mockAllSpaceSafes.mockReturnValue({ currentData: inSpaces(SPACE_A, SPACE_B), isLoading: false, isFetching: false })

    const { replace } = renderAttach()

    expect(replace).not.toHaveBeenCalled()
  })

  it('ignores a Workspace that holds the same address on another chain', () => {
    mockAllSpaceSafes.mockReturnValue({
      currentData: [{ spaceUuid: SPACE_A, safes: { '137': [SAFE_ADDRESS] } }],
      isLoading: false,
      isFetching: false,
    })

    const { replace } = renderAttach()

    expect(replace).not.toHaveBeenCalled()
  })

  it('leaves a Workspace page with a Safe in its query alone', () => {
    const { replace } = renderAttach({ pathname: '/spaces/safe-accounts' })

    expect(replace).not.toHaveBeenCalled()
  })
})
