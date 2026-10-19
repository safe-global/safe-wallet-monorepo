import { render, screen, waitFor } from '@/tests/test-utils'
import userEvent from '@testing-library/user-event'
import type { GetSpaceResponse } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { spaceBuilder } from '@/tests/builders/space'
import { ELEVATION_REQUIRED_ERROR } from '@/features/oidc-auth/utils/elevation'
import ExperimentalPage from '../ExperimentalPage'

const SPACE_ID = 'space-uuid-1'

const mockUseIsAdmin = jest.fn()
const mockUseIsAllowlistAvailableInSpace = jest.fn()
const mockIsAuthenticated = jest.fn()
const mockShowNotification = jest.fn((payload: unknown) => ({ type: 'notifications/show', payload }))
const mockUseSpacesGetOneV1Query = jest.fn()
const mockUnwrap = jest.fn()
const mockUpdateSpace = jest.fn(() => ({ unwrap: mockUnwrap }))
const mockUseSpacesUpdateV1Mutation = jest.fn()

jest.mock('@/features/spaces', () => ({
  useIsAdmin: () => mockUseIsAdmin(),
  useCurrentSpaceId: () => SPACE_ID,
}))

jest.mock('@/features/policy-guard', () => ({
  useIsAllowlistAvailableInSpace: () => mockUseIsAllowlistAvailableInSpace(),
}))

jest.mock('@/store/authSlice', () => ({
  ...jest.requireActual('@/store/authSlice'),
  isAuthenticated: () => mockIsAuthenticated(),
}))

jest.mock('@/store/notificationsSlice', () => ({
  ...jest.requireActual('@/store/notificationsSlice'),
  showNotification: (payload: unknown) => mockShowNotification(payload),
}))

jest.mock('@safe-global/store/gateway/AUTO_GENERATED/spaces', () => ({
  useSpacesGetOneV1Query: (...args: unknown[]) => mockUseSpacesGetOneV1Query(...args),
  useSpacesUpdateV1Mutation: () => mockUseSpacesUpdateV1Mutation(),
}))

const mockSpaceQuery = (space: GetSpaceResponse | undefined, isFetching = false) => {
  mockUseSpacesGetOneV1Query.mockReturnValue({ currentData: space, isFetching })
}

const getToggle = () => screen.getByRole('switch', { name: 'Recipient allowlist' })

describe('ExperimentalPage', () => {
  const optedOutSpace = spaceBuilder().with({ uuid: SPACE_ID, experimentalFeatures: [] }).build()
  const optedInSpace = spaceBuilder()
    .with({ uuid: SPACE_ID, experimentalFeatures: ['POLICY_RECIPIENT_ALLOWLIST'] })
    .build()

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseIsAdmin.mockReturnValue(true)
    mockUseIsAllowlistAvailableInSpace.mockReturnValue(true)
    mockIsAuthenticated.mockReturnValue(true)
    mockUseSpacesUpdateV1Mutation.mockReturnValue([mockUpdateSpace, { isLoading: false }])
    mockUnwrap.mockResolvedValue({ uuid: SPACE_ID })
    mockSpaceQuery(optedOutSpace)
  })

  it('shows the switch checked when the space has opted in', () => {
    mockSpaceQuery(optedInSpace)
    render(<ExperimentalPage />)

    expect(getToggle()).toBeChecked()
  })

  it('sends the full feature list when an admin turns the allowlist on', async () => {
    render(<ExperimentalPage />)

    await userEvent.click(getToggle())

    expect(mockUpdateSpace).toHaveBeenCalledWith({
      id: SPACE_ID,
      updateSpaceDto: { experimentalFeatures: ['POLICY_RECIPIENT_ALLOWLIST'] },
    })
  })

  it('sends an empty list when turning the allowlist off', async () => {
    mockSpaceQuery(optedInSpace)
    render(<ExperimentalPage />)

    await userEvent.click(getToggle())

    expect(mockUpdateSpace).toHaveBeenCalledWith({ id: SPACE_ID, updateSpaceDto: { experimentalFeatures: [] } })
  })

  it('keeps the switch optimistic and disabled while the update is in flight', async () => {
    mockUnwrap.mockReturnValue(new Promise(() => {}))
    render(<ExperimentalPage />)

    await userEvent.click(getToggle())

    expect(getToggle()).toBeChecked()
    expect(getToggle()).toHaveAttribute('aria-disabled', 'true')
  })

  it('reverts the switch and shows an error notification when the update fails', async () => {
    mockUnwrap.mockRejectedValue({ status: 500, data: { message: 'Boom' } })
    jest.spyOn(console, 'error').mockImplementation(() => {})
    render(<ExperimentalPage />)

    await userEvent.click(getToggle())

    await waitFor(() => expect(getToggle()).not.toBeChecked())
    expect(getToggle()).not.toHaveAttribute('aria-disabled', 'true')
    expect(mockShowNotification).toHaveBeenCalledWith(
      expect.objectContaining({ variant: 'error', message: 'Failed to update experimental features' }),
    )
  })

  it('does not show a notification for an elevation-required error', async () => {
    mockUnwrap.mockRejectedValue({ status: 403, data: { message: ELEVATION_REQUIRED_ERROR } })
    render(<ExperimentalPage />)

    await userEvent.click(getToggle())

    await waitFor(() => expect(getToggle()).not.toBeChecked())
    expect(mockShowNotification).not.toHaveBeenCalled()
  })

  it('hides the allowlist row and shows the empty message when the allowlist is unavailable', () => {
    mockUseIsAllowlistAvailableInSpace.mockReturnValue(false)
    render(<ExperimentalPage />)

    expect(screen.queryByRole('switch', { name: 'Recipient allowlist' })).not.toBeInTheDocument()
    expect(screen.getByTestId('experimental-empty')).toBeInTheDocument()
  })

  it('disables the toggle for non-admins', () => {
    mockUseIsAdmin.mockReturnValue(false)
    render(<ExperimentalPage />)

    expect(getToggle()).toHaveAttribute('aria-disabled', 'true')
  })

  it('disables the switch while the space is loading', () => {
    mockSpaceQuery(undefined)
    render(<ExperimentalPage />)

    expect(getToggle()).toHaveAttribute('aria-disabled', 'true')
  })

  it('skips the space query when signed out', () => {
    mockIsAuthenticated.mockReturnValue(false)
    render(<ExperimentalPage />)

    expect(mockUseSpacesGetOneV1Query).toHaveBeenCalledWith({ id: SPACE_ID }, { skip: true })
  })
})
