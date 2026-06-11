import { render } from '@testing-library/react'
import AuthState from './index'

const mockUseSpacesGetOneV1Query = jest.fn()
const mockUseUsersGetWithWalletsV1Query = jest.fn()
const mockUseHasFeature = jest.fn()
const mockDispatch = jest.fn()
let mockIsAuthenticated = true
let mockIsOidcLoginPending = false

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
  MemberStatus: { DECLINED: 'DECLINED' },
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
})
