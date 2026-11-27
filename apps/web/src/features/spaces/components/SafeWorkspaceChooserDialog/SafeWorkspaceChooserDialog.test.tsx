import { fireEvent, render, screen } from '@/tests/test-utils'
import type { RootState } from '@/store'
import SafeWorkspaceChooserDialog from './index'

const SPACE_A = '11111111-1111-1111-1111-111111111111'
const SPACE_B = '22222222-2222-2222-2222-222222222222'
const SPACE_OTHER = '33333333-3333-3333-3333-333333333333'
const SAFE_ADDRESS = '0x0000000000000000000000000000000000000001'

const ALL_SPACES = [
  { uuid: SPACE_A, name: 'Treasury', safeCount: 4 },
  { uuid: SPACE_B, name: 'Operations', safeCount: 1 },
  { uuid: SPACE_OTHER, name: 'Unrelated', safeCount: 2 },
]
let mockSpaces = ALL_SPACES
jest.mock('@safe-global/store/gateway/AUTO_GENERATED/spaces', () => ({
  ...jest.requireActual('@safe-global/store/gateway/AUTO_GENERATED/spaces'),
  useSpaceSafesGetAllV1Query: () => ({
    currentData: [
      { spaceUuid: SPACE_A, safes: { '1': [SAFE_ADDRESS] } },
      { spaceUuid: SPACE_B, safes: { '1': [SAFE_ADDRESS] } },
      { spaceUuid: SPACE_OTHER, safes: { '1': [] } },
    ],
    isLoading: false,
    isFetching: false,
    error: undefined,
    refetch: jest.fn(),
  }),
  useSpacesGetV1Query: () => ({ currentData: mockSpaces }),
}))
jest.mock('@/hooks/useIsSafeProEnabled', () => ({ useIsSafeProEnabled: () => false }))
jest.mock('@/hooks/useChainId', () => ({ __esModule: true, default: () => '1' }))
let mockSafeAddress = SAFE_ADDRESS
jest.mock('@/hooks/useSafeAddressFromUrl', () => ({ useSafeAddressFromUrl: () => mockSafeAddress }))

const signedIn = {
  auth: {
    sessionExpiresAt: Date.now() + 60_000,
    landingSpaceHint: null,
    isStoreHydrated: true,
    cfSafeSynced: false,
    isOidcLoginPending: false,
    isSessionCheckPending: false,
  },
} as Partial<RootState>

const renderDialog = (query: Record<string, string> = { safe: `eth:${SAFE_ADDRESS}` }) => {
  const replace = jest.fn(() => Promise.resolve(true))
  const { rerender } = render(<SafeWorkspaceChooserDialog />, {
    initialReduxState: signedIn,
    routerProps: { pathname: '/home', query, replace },
  })
  const leaveAndReturnToSafe = () => {
    mockSafeAddress = ''
    rerender(<SafeWorkspaceChooserDialog />)
    mockSafeAddress = SAFE_ADDRESS
    rerender(<SafeWorkspaceChooserDialog />)
  }
  return { replace, leaveAndReturnToSafe }
}

describe('SafeWorkspaceChooserDialog', () => {
  beforeEach(() => {
    mockSpaces = ALL_SPACES
    mockSafeAddress = SAFE_ADDRESS
  })

  it('lists only the Workspaces that hold the Safe, with their Safe counts', () => {
    renderDialog()

    expect(screen.getByRole('button', { name: /Treasury.*4 Safe accounts/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Operations.*1 Safe account$/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Unrelated/ })).not.toBeInTheDocument()
  })

  it('describes the choice to assistive technology', () => {
    renderDialog()

    expect(screen.getByRole('dialog', { name: 'Open this Safe in a Workspace' })).toHaveAccessibleDescription(
      'This Safe is in more than one of your Workspaces. Choose the Workspace to open it in.',
    )
  })

  it('opens the Safe in the chosen Workspace and closes', () => {
    const { replace } = renderDialog()

    fireEvent.click(screen.getByRole('button', { name: /Operations/ }))

    expect(replace).toHaveBeenCalledWith(
      { pathname: '/home', query: { safe: `eth:${SAFE_ADDRESS}`, spaceId: SPACE_B } },
      undefined,
      { shallow: true },
    )
    expect(screen.queryByTestId('safe-workspace-chooser-dialog')).not.toBeInTheDocument()
  })

  it('closes without a Workspace when the user continues without one', () => {
    const { replace } = renderDialog()

    fireEvent.click(screen.getByRole('button', { name: 'Continue without Workspace' }))

    expect(replace).not.toHaveBeenCalled()
    expect(screen.queryByTestId('safe-workspace-chooser-dialog')).not.toBeInTheDocument()
  })

  it('stays closed when the URL already has a Workspace', () => {
    renderDialog({ safe: `eth:${SAFE_ADDRESS}`, spaceId: SPACE_A })

    expect(screen.queryByTestId('safe-workspace-chooser-dialog')).not.toBeInTheDocument()
  })

  it('stays closed while the Workspace list does not have the Workspaces of the Safe yet', () => {
    mockSpaces = [{ uuid: SPACE_OTHER, name: 'Unrelated', safeCount: 2 }]

    renderDialog()

    expect(screen.queryByTestId('safe-workspace-chooser-dialog')).not.toBeInTheDocument()
  })

  it.each([
    ['chose a Workspace', /Operations/],
    ['continued without one', 'Continue without Workspace'],
  ])('asks again on the next visit to the Safe after the user %s', (_, answer) => {
    const { leaveAndReturnToSafe } = renderDialog()
    fireEvent.click(screen.getByRole('button', { name: answer }))

    leaveAndReturnToSafe()

    expect(screen.getByTestId('safe-workspace-chooser-dialog')).toBeInTheDocument()
  })
})
