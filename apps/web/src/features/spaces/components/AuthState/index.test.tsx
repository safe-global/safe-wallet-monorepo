import { render, screen } from '@testing-library/react'
import AuthState from './index'
import { SPACE_REFRESH_OPTIONS } from '../../hooks/refreshOptions'

const mockUseSpacesGetOneV1Query = jest.fn()
const mockUseUsersGetWithWalletsV1Query = jest.fn()
const mockUseHasFeature = jest.fn()
const mockDispatch = jest.fn()
const mockReplace = jest.fn()
const mockIsUnauthorized = jest.fn()
let mockIsAuthenticated = true
let mockIsOidcLoginPending = false

jest.mock('next/router', () => ({
  useRouter: () => ({ replace: mockReplace }),
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
  isUnauthorized: (...args: unknown[]) => mockIsUnauthorized(...args),
}))

jest.mock('@/config/routes', () => ({
  AppRoutes: { welcome: { spaces: '/welcome/spaces' } },
}))

jest.mock('@/features/spaces', () => ({
  MemberStatus: { ACTIVE: 'ACTIVE' },
}))

describe('AuthState', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockIsAuthenticated = true
    mockIsOidcLoginPending = false
    mockIsUnauthorized.mockReturnValue(false)
    mockUseHasFeature.mockReturnValue(true)
    mockUseSpacesGetOneV1Query.mockReturnValue({
      currentData: { uuid: 'uuid-1', members: [{ user: { id: 'u1' }, status: 'ACTIVE' }] },
      error: undefined,
      isLoading: false,
      isFetching: false,
    })
    mockUseUsersGetWithWalletsV1Query.mockReturnValue({ currentData: { id: 'u1' } })
  })

  it('skips the space query when the user is not authenticated', () => {
    mockIsAuthenticated = false

    render(
      <AuthState spaceId="11111111-1111-1111-1111-111111111111">
        <div />
      </AuthState>,
    )

    expect(mockUseSpacesGetOneV1Query).toHaveBeenCalledWith(expect.anything(), { skip: true, ...SPACE_REFRESH_OPTIONS })
  })

  it('skips the space query when spaceId is empty', () => {
    render(
      <AuthState spaceId="">
        <div />
      </AuthState>,
    )

    expect(mockUseSpacesGetOneV1Query).toHaveBeenCalledWith(expect.anything(), { skip: true, ...SPACE_REFRESH_OPTIONS })
  })

  it('skips the space query when spaceId is null at runtime', () => {
    render(
      <AuthState spaceId={null as unknown as string}>
        <div />
      </AuthState>,
    )

    expect(mockUseSpacesGetOneV1Query).toHaveBeenCalledWith(expect.anything(), { skip: true, ...SPACE_REFRESH_OPTIONS })
  })

  it('skips the space query when spaceId is undefined at runtime', () => {
    render(
      <AuthState spaceId={undefined as unknown as string}>
        <div />
      </AuthState>,
    )

    expect(mockUseSpacesGetOneV1Query).toHaveBeenCalledWith(expect.anything(), { skip: true, ...SPACE_REFRESH_OPTIONS })
  })

  it('fires the space query with the uuid when authenticated and spaceId is set', () => {
    render(
      <AuthState spaceId="11111111-1111-1111-1111-111111111111">
        <div />
      </AuthState>,
    )

    expect(mockUseSpacesGetOneV1Query).toHaveBeenCalledWith(
      { id: '11111111-1111-1111-1111-111111111111' },
      { skip: false, ...SPACE_REFRESH_OPTIONS },
    )
  })

  it('renders the children for an active member', () => {
    render(
      <AuthState spaceId="11111111-1111-1111-1111-111111111111">
        <div data-testid="children" />
      </AuthState>,
    )

    expect(screen.getByTestId('children')).toBeInTheDocument()
    expect(mockReplace).not.toHaveBeenCalled()
  })

  it('redirects to the spaces overview when the space query is unauthorized', () => {
    mockIsUnauthorized.mockReturnValue(true)
    mockUseSpacesGetOneV1Query.mockReturnValue({ currentData: undefined, error: { status: 404 }, isLoading: false })

    const { queryByTestId } = render(
      <AuthState spaceId="11111111-1111-1111-1111-111111111111">
        <div data-testid="children" />
      </AuthState>,
    )

    expect(mockReplace).toHaveBeenCalledWith('/welcome/spaces')
    expect(queryByTestId('children')).toBeNull()
    expect(queryByTestId('unauthorized')).not.toBeNull()
  })

  it('redirects an invited (pending) member to the workspace list without showing the red error state', () => {
    mockUseSpacesGetOneV1Query.mockReturnValue({
      currentData: { id: 1, members: [{ user: { id: 'u1' }, status: 'INVITED' }] },
      error: undefined,
      isLoading: false,
      isFetching: false,
    })

    const { queryByTestId } = render(
      <AuthState spaceId="11111111-1111-1111-1111-111111111111">
        <div data-testid="children" />
      </AuthState>,
    )

    expect(mockReplace).toHaveBeenCalledWith('/welcome/spaces')
    expect(queryByTestId('children')).toBeNull()
    // Inactive members get the neutral loading state, not the red UnauthorizedState
    expect(queryByTestId('loading')).not.toBeNull()
    expect(queryByTestId('unauthorized')).toBeNull()
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

    const { queryByTestId } = render(
      <AuthState spaceId="11111111-1111-1111-1111-111111111111">
        <div data-testid="children" />
      </AuthState>,
    )

    expect(mockReplace).not.toHaveBeenCalled()
    // The stale INVITED data must not flash the space content either
    expect(queryByTestId('children')).toBeNull()
    expect(queryByTestId('loading')).not.toBeNull()
  })

  it('redirects to the spaces overview when the current user has declined membership', () => {
    mockUseSpacesGetOneV1Query.mockReturnValue({
      currentData: { id: 1, members: [{ user: { id: 'u1' }, status: 'DECLINED' }] },
      error: undefined,
      isLoading: false,
      isFetching: false,
    })

    const { queryByTestId } = render(
      <AuthState spaceId="11111111-1111-1111-1111-111111111111">
        <div data-testid="children" />
      </AuthState>,
    )

    expect(mockReplace).toHaveBeenCalledWith('/welcome/spaces')
    expect(queryByTestId('children')).toBeNull()
  })

  it('does not redirect while the current user is still loading', () => {
    mockUseUsersGetWithWalletsV1Query.mockReturnValue({ currentData: undefined })

    render(
      <AuthState spaceId="11111111-1111-1111-1111-111111111111">
        <div data-testid="children" />
      </AuthState>,
    )

    expect(mockReplace).not.toHaveBeenCalled()
  })

  it('does not redirect while the space query is still loading', () => {
    mockIsUnauthorized.mockReturnValue(true)
    mockUseSpacesGetOneV1Query.mockReturnValue({ currentData: undefined, error: undefined, isLoading: true })

    const { queryByTestId } = render(
      <AuthState spaceId="11111111-1111-1111-1111-111111111111">
        <div data-testid="children" />
      </AuthState>,
    )

    expect(mockReplace).not.toHaveBeenCalled()
    expect(queryByTestId('loading')).not.toBeNull()
  })

  it('does not redirect when the user is signed out', () => {
    mockIsAuthenticated = false
    mockIsUnauthorized.mockReturnValue(true)

    const { queryByTestId } = render(
      <AuthState spaceId="11111111-1111-1111-1111-111111111111">
        <div data-testid="children" />
      </AuthState>,
    )

    expect(mockReplace).not.toHaveBeenCalled()
    expect(queryByTestId('signed-out')).not.toBeNull()
  })

  it('does not redirect when the user is still authorized', () => {
    const { queryByTestId } = render(
      <AuthState spaceId="11111111-1111-1111-1111-111111111111">
        <div data-testid="children" />
      </AuthState>,
    )

    expect(mockReplace).not.toHaveBeenCalled()
    expect(queryByTestId('children')).not.toBeNull()
  })
})
