import { fireEvent, render, screen } from '@/tests/test-utils'
import SafeWorkspaceSignInDialog from '../index'

const SPACE_ID = '11111111-1111-1111-1111-111111111111'
const SAFE = 'eth:0x0000000000000000000000000000000000000001'

jest.mock('../../SignInOptions', () => ({
  __esModule: true,
  default: () => <div data-testid="sign-in-options" />,
}))
jest.mock('@/hooks/useChainId', () => ({ __esModule: true, default: () => '1' }))
jest.mock('@safe-global/store/gateway/AUTO_GENERATED/spaces', () => ({
  useSpacesGetOneV1Query: () => ({ currentData: undefined, error: undefined }),
  useSpaceSafesGetV1Query: () => ({ currentData: undefined }),
}))
jest.mock('@safe-global/store/gateway/AUTO_GENERATED/users', () => ({
  useUsersGetWithWalletsV1Query: () => ({ currentData: undefined }),
}))

const authState = (signedIn: boolean) => ({
  auth: {
    sessionExpiresAt: signedIn ? Date.now() + 60_000 : null,
    landingSpaceHint: null,
    isStoreHydrated: true,
    cfSafeSynced: false,
    isOidcLoginPending: false,
    isSessionCheckPending: false,
  },
})

type RenderOptions = { signedIn?: boolean; query?: Record<string, string> }

const renderDialog = ({ signedIn = false, query = { safe: SAFE, spaceId: SPACE_ID } }: RenderOptions = {}) => {
  const replace = jest.fn(() => Promise.resolve(true))
  render(<SafeWorkspaceSignInDialog />, {
    initialReduxState: authState(signedIn),
    routerProps: { pathname: '/home', query, replace },
  })
  return replace
}

describe('SafeWorkspaceSignInDialog', () => {
  beforeEach(() => window.localStorage.clear())

  it('asks a signed-out user to sign in when the Safe link has a Workspace', () => {
    renderDialog()

    expect(screen.getByText('Sign in to open this Safe in its Workspace')).toBeInTheDocument()
    expect(screen.getByTestId('sign-in-options')).toBeInTheDocument()
  })

  it('opens the Safe outside the Workspace when the user continues without it', () => {
    const replace = renderDialog()

    fireEvent.click(screen.getByText('Continue without Workspace'))

    expect(replace).toHaveBeenCalledWith({ pathname: '/home', query: { safe: SAFE } }, undefined, { shallow: true })
  })

  it('stays closed when the Safe link has no Workspace', () => {
    renderDialog({ query: { safe: SAFE } })

    expect(screen.queryByTestId('safe-workspace-sign-in-dialog')).not.toBeInTheDocument()
  })

  it('stays closed for a signed-in user, whom the Workspace check handles', () => {
    renderDialog({ signedIn: true })

    expect(screen.queryByTestId('safe-workspace-sign-in-dialog')).not.toBeInTheDocument()
  })

  it('stays closed on a page that is not a Safe page', () => {
    renderDialog({ query: { safe: '', spaceId: SPACE_ID } })

    expect(screen.queryByTestId('safe-workspace-sign-in-dialog')).not.toBeInTheDocument()
  })
})
