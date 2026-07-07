import { act } from '@testing-library/react'
import { renderHook } from '@/tests/test-utils'
import { useSpaceBackLink } from '../useSpaceBackLink'

const mockPush = jest.fn()

jest.mock('@/features/spaces', () => ({
  useCurrentSpaceId: jest.fn(),
}))

jest.mock('@safe-global/store/gateway/AUTO_GENERATED/spaces', () => ({
  useSpacesGetOneV1Query: jest.fn(),
}))

import { useCurrentSpaceId } from '@/features/spaces'
import { useSpacesGetOneV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { AppRoutes } from '@/config/routes'
import { spaceBuilder } from '@/tests/builders/space'
import type { RootState } from '@/store'

const MOCK_SPACE_UUID = '11111111-1111-1111-1111-111111111111'
const MOCK_SPACE_UUID_ALT = '22222222-2222-2222-2222-222222222222'
const mockSpace = spaceBuilder().with({ uuid: MOCK_SPACE_UUID, name: 'Acme Corp' }).build()

const mockUseCurrentSpaceId = useCurrentSpaceId as jest.Mock
const mockUseSpacesGetOneV1Query = useSpacesGetOneV1Query as jest.Mock

const SESSION_AHEAD_MS = 1_000_000

const authState = (signedIn: boolean): RootState['auth'] => ({
  sessionExpiresAt: signedIn ? Date.now() + SESSION_AHEAD_MS : null,
  lastUsedSpace: null,
  isStoreHydrated: true,
  cfSafeSynced: false,
  isOidcLoginPending: false,
})

// Renders the hook against a real store so the actual selectors (isAuthenticated,
// selectLastUsedSpaceOrigin) run — seeding state instead of mocking useAppSelector keeps the test
// robust if a selector is later memoised or re-exported through a barrel.
function renderBackLink(
  opts: {
    spaceId?: string | null
    signedIn?: boolean
    space?: object | null
    origin?: RootState['spaceNavigation']['origin']
  } = {},
) {
  mockUseCurrentSpaceId.mockReturnValue('spaceId' in opts ? opts.spaceId : MOCK_SPACE_UUID)
  mockUseSpacesGetOneV1Query.mockReturnValue({ currentData: 'space' in opts ? opts.space : mockSpace })

  return renderHook(() => useSpaceBackLink(), {
    routerProps: { push: mockPush },
    initialReduxState: {
      auth: authState(opts.signedIn ?? true),
      spaceNavigation: { origin: opts.origin ?? null },
    },
  })
}

describe('useSpaceBackLink', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns space data from the query', () => {
    const { result } = renderBackLink()

    expect(result.current.space).toEqual(mockSpace)
  })

  it('falls back to the workspace landing when no origin is recorded', () => {
    const { result } = renderBackLink()

    act(() => {
      result.current.handleBackToSpace()
    })

    expect(mockPush).toHaveBeenCalledWith({
      pathname: AppRoutes.spaces.index,
      query: { spaceId: MOCK_SPACE_UUID },
    })
  })

  it('navigates back to the recorded origin when it belongs to the current space', () => {
    const { result } = renderBackLink({ origin: { path: AppRoutes.spaces.security, spaceId: MOCK_SPACE_UUID } })

    act(() => {
      result.current.handleBackToSpace()
    })

    expect(mockPush).toHaveBeenCalledWith({
      pathname: AppRoutes.spaces.security,
      query: { spaceId: MOCK_SPACE_UUID },
    })
  })

  it('falls back to the workspace landing when the recorded origin belongs to a different space', () => {
    // Stale origin captured in another workspace must not misroute "back" for this Safe.
    const { result } = renderBackLink({ origin: { path: AppRoutes.spaces.security, spaceId: MOCK_SPACE_UUID_ALT } })

    act(() => {
      result.current.handleBackToSpace()
    })

    expect(mockPush).toHaveBeenCalledWith({
      pathname: AppRoutes.spaces.index,
      query: { spaceId: MOCK_SPACE_UUID },
    })
  })

  it('does not navigate when spaceId is undefined', () => {
    const { result } = renderBackLink({ spaceId: undefined })

    act(() => {
      result.current.handleBackToSpace()
    })

    expect(mockPush).not.toHaveBeenCalled()
  })

  it('skips the query when user is not signed in', () => {
    renderBackLink({ signedIn: false })

    expect(mockUseSpacesGetOneV1Query).toHaveBeenCalledWith(
      { id: MOCK_SPACE_UUID },
      expect.objectContaining({ skip: true }),
    )
  })

  it('skips the query when spaceId is not available', () => {
    renderBackLink({ spaceId: undefined })

    expect(mockUseSpacesGetOneV1Query).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ skip: true }))
  })

  it('does not skip the query when both signed in and spaceId are available', () => {
    renderBackLink({ spaceId: MOCK_SPACE_UUID_ALT, signedIn: true })

    expect(mockUseSpacesGetOneV1Query).toHaveBeenCalledWith(
      { id: MOCK_SPACE_UUID_ALT },
      expect.objectContaining({ skip: false }),
    )
  })

  it('returns undefined space when query has no data', () => {
    const { result } = renderBackLink({ space: undefined })

    expect(result.current.space).toBeUndefined()
  })
})
