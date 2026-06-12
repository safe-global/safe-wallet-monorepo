import { render, screen } from '@testing-library/react'
import AuthState from './index'
import { AppRoutes } from '@/config/routes'

const mockUseSpacesGetOneV1Query = jest.fn()
const mockUseUsersGetWithWalletsV1Query = jest.fn()
const mockUseHasFeature = jest.fn()
const mockDispatch = jest.fn()
const mockRouterReplace = jest.fn()
let mockIsAuthenticated = true
let mockIsOidcLoginPending = false

jest.mock('next/router', () => ({
  useRouter: () => ({ replace: mockRouterReplace }),
}))

jest.mock('@/store', () => ({
  useAppSelector: (selector: string) => {
    if (selector === 'isAuthenticated') return mockIsAuthenticated
    if (selector === 'selectIsOidcLoginPending') return mockIsOidcLoginPending
    return undefined
  },
  useAppDispatch: () => mockDispatch,
}))

jest.mock('@/store/authSlice', () => ({
  isAuthenticated: 'isAuthenticated',
  selectIsOidcLoginPending: 'selectIsOidcLoginPending',
  setLastUsedSpace: (id: string) => ({ type: 'setLastUsedSpace', payload: id }),
}))

jest.mock('@safe-global/store/gateway/AUTO_GENERATED/spaces', () => ({
  useSpacesGetOneV1Query: (...args: unknown[]) => mockUseSpacesGetOneV1Query(...args),
}))

jest.mock('@safe-global/store/gateway/AUTO_GENERATED/users', () => ({
  useUsersGetWithWalletsV1Query: (...args: unknown[]) => mockUseUsersGetWithWalletsV1Query(...args),
}))

jest.mock('@/hooks/useChains', () => ({
  useHasFeature: () => mockUseHasFeature(),
}))

jest.mock('../SignedOutState', () => ({
  __esModule: true,
  default: () => <div data-testid="signed-out" />,
}))

jest.mock('../UnauthorizedState', () => ({
  __esModule: true,
  default: () => <div data-testid="unauthorized" />,
}))

jest.mock('../LoadingState', () => ({
  __esModule: true,
  default: () => <div data-testid="loading" />,
}))

jest.mock('@/features/spaces/utils', () => ({
  isUnauthorized: () => false,
}))

jest.mock('@/features/spaces', () => ({
  MemberStatus: { ACTIVE: 'ACTIVE' },
}))

describe('AuthState', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockIsAuthenticated = true
    mockIsOidcLoginPending = false
    mockUseHasFeature.mockReturnValue(true)
    mockUseSpacesGetOneV1Query.mockReturnValue({
      currentData: { id: 1, members: [] },
      error: undefined,
      isLoading: false,
      isFetching: false,
    })
    mockUseUsersGetWithWalletsV1Query.mockReturnValue({ currentData: { id: 'u1' } })
  })

  it('skips the space query when the user is not authenticated', () => {
    mockIsAuthenticated = false

    render(
      <AuthState spaceId="7">
        <div />
      </AuthState>,
    )

    expect(mockUseSpacesGetOneV1Query).toHaveBeenCalledWith(expect.anything(), { skip: true })
  })

  it('skips the space query when spaceId is empty', () => {
    render(
      <AuthState spaceId="">
        <div />
      </AuthState>,
    )

    // Without the guard, Number('') would be 0 and the query would hit /v1/spaces/0
    expect(mockUseSpacesGetOneV1Query).toHaveBeenCalledWith(expect.anything(), { skip: true })
  })

  it('skips the space query when spaceId is null at runtime (Number(null) is 0)', () => {
    render(
      <AuthState spaceId={null as unknown as string}>
        <div />
      </AuthState>,
    )

    expect(mockUseSpacesGetOneV1Query).toHaveBeenCalledWith(expect.anything(), { skip: true })
  })

  it('skips the space query when spaceId is undefined at runtime', () => {
    render(
      <AuthState spaceId={undefined as unknown as string}>
        <div />
      </AuthState>,
    )

    expect(mockUseSpacesGetOneV1Query).toHaveBeenCalledWith(expect.anything(), { skip: true })
  })

  it('fires the space query with the uuid when authenticated and spaceId is set', () => {
    render(
      <AuthState spaceId="11111111-1111-1111-1111-111111111111">
        <div />
      </AuthState>,
    )

    expect(mockUseSpacesGetOneV1Query).toHaveBeenCalledWith(
      { id: '11111111-1111-1111-1111-111111111111' },
      { skip: false },
    )
  })

  it('renders the children for an active member', () => {
    mockUseSpacesGetOneV1Query.mockReturnValue({
      currentData: { id: 1, members: [{ user: { id: 'u1' }, status: 'ACTIVE' }] },
      error: undefined,
      isLoading: false,
      isFetching: false,
    })

    render(
      <AuthState spaceId="7">
        <div data-testid="space-content" />
      </AuthState>,
    )

    expect(screen.getByTestId('space-content')).toBeInTheDocument()
    expect(mockRouterReplace).not.toHaveBeenCalled()
  })

  it('redirects an invited (pending) member to the workspace list instead of rendering the space', () => {
    mockUseSpacesGetOneV1Query.mockReturnValue({
      currentData: { id: 1, members: [{ user: { id: 'u1' }, status: 'INVITED' }] },
      error: undefined,
      isLoading: false,
      isFetching: false,
    })

    render(
      <AuthState spaceId="7">
        <div data-testid="space-content" />
      </AuthState>,
    )

    expect(screen.queryByTestId('space-content')).not.toBeInTheDocument()
    expect(screen.getByTestId('loading')).toBeInTheDocument()
    expect(mockRouterReplace).toHaveBeenCalledWith({ pathname: AppRoutes.welcome.spaces })
  })

  // Accepting an invite invalidates the 'spaces' tag — while the stale cache
  // entry (status INVITED) refetches, the member must not be bounced back to
  // the workspace list they just accepted from.
  it('does not redirect an invited member while the space query is refetching', () => {
    mockUseSpacesGetOneV1Query.mockReturnValue({
      currentData: { id: 1, members: [{ user: { id: 'u1' }, status: 'INVITED' }] },
      error: undefined,
      isLoading: false,
      isFetching: true,
    })

    render(
      <AuthState spaceId="7">
        <div data-testid="space-content" />
      </AuthState>,
    )

    expect(mockRouterReplace).not.toHaveBeenCalled()
    // The stale INVITED data must not flash the space content either
    expect(screen.queryByTestId('space-content')).not.toBeInTheDocument()
    expect(screen.getByTestId('loading')).toBeInTheDocument()
  })

  it('redirects a declined member to the workspace list instead of rendering the space', () => {
    mockUseSpacesGetOneV1Query.mockReturnValue({
      currentData: { id: 1, members: [{ user: { id: 'u1' }, status: 'DECLINED' }] },
      error: undefined,
      isLoading: false,
      isFetching: false,
    })

    render(
      <AuthState spaceId="7">
        <div data-testid="space-content" />
      </AuthState>,
    )

    expect(screen.queryByTestId('space-content')).not.toBeInTheDocument()
    expect(screen.getByTestId('loading')).toBeInTheDocument()
    expect(mockRouterReplace).toHaveBeenCalledWith({ pathname: AppRoutes.welcome.spaces })
  })

  it('does not redirect while the current user is still loading', () => {
    mockUseSpacesGetOneV1Query.mockReturnValue({
      currentData: { id: 1, members: [{ user: { id: 'u1' }, status: 'ACTIVE' }] },
      error: undefined,
      isLoading: false,
      isFetching: false,
    })
    mockUseUsersGetWithWalletsV1Query.mockReturnValue({ currentData: undefined })

    render(
      <AuthState spaceId="7">
        <div data-testid="space-content" />
      </AuthState>,
    )

    expect(mockRouterReplace).not.toHaveBeenCalled()
  })
})
