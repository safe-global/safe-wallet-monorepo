import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { Provider } from 'react-redux'
import { makeStore } from '@/store'
import LeaveSpaceDialog from '../LeaveSpaceDialog'
import type { GetSpaceResponse } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { AppRoutes } from '@/config/routes'

const mockLeaveSpace = jest.fn()
const mockRouterPush = jest.fn()
let mockIsLoading = false

jest.mock('@safe-global/store/gateway/AUTO_GENERATED/spaces', () => ({
  useMembersSelfRemoveV1Mutation: jest.fn(() => [mockLeaveSpace, { isLoading: mockIsLoading }]),
}))

jest.mock('next/router', () => ({
  useRouter: () => ({ push: mockRouterPush }),
}))

jest.mock('@/services/analytics', () => ({
  trackEvent: jest.fn(),
}))

const mockSpace: GetSpaceResponse = { id: 7, name: 'My Workspace', members: [], safeCount: 0 }

const renderDialog = (opts: { space?: GetSpaceResponse | undefined; onClose?: () => void } = {}) => {
  const space = 'space' in opts ? opts.space : mockSpace
  const onClose = opts.onClose ?? jest.fn()
  const store = makeStore(undefined, { skipBroadcast: true })
  return {
    store,
    onClose,
    ...render(
      <Provider store={store}>
        <LeaveSpaceDialog space={space} onClose={onClose} />
      </Provider>,
    ),
  }
}

describe('LeaveSpaceDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockLeaveSpace.mockReset()
    mockIsLoading = false
  })

  it('renders the dialog with the space name', () => {
    renderDialog()
    expect(screen.getByText('My Workspace')).toBeInTheDocument()
  })

  it('confirm button is disabled when space is undefined', () => {
    renderDialog({ space: undefined })
    expect(screen.getByTestId('space-confirm-leave-button')).toBeDisabled()
  })

  it('calls leaveSpace with the space id on confirm', async () => {
    mockLeaveSpace.mockReturnValue({ unwrap: () => Promise.resolve() })
    renderDialog()

    fireEvent.click(screen.getByTestId('space-confirm-leave-button'))

    await waitFor(() => {
      expect(mockLeaveSpace).toHaveBeenCalledWith({ spaceId: 7 })
    })
  })

  it('redirects to the spaces welcome page after successfully leaving', async () => {
    mockLeaveSpace.mockReturnValue({ unwrap: () => Promise.resolve() })
    renderDialog()

    fireEvent.click(screen.getByTestId('space-confirm-leave-button'))

    await waitFor(() => {
      expect(mockRouterPush).toHaveBeenCalledWith({ pathname: AppRoutes.welcome.spaces })
    })
  })

  it('dispatches a success notification after leaving', async () => {
    mockLeaveSpace.mockReturnValue({ unwrap: () => Promise.resolve() })
    const { store } = renderDialog()

    fireEvent.click(screen.getByTestId('space-confirm-leave-button'))

    await waitFor(() => {
      const notifications = store.getState().notifications
      expect(notifications.length).toBeGreaterThan(0)
      const last = notifications[notifications.length - 1]
      expect(last.message).toBe('Left workspace My Workspace.')
      expect(last.variant).toBe('success')
    })
  })

  it('shows an error message when leaving fails', async () => {
    mockLeaveSpace.mockReturnValue({ unwrap: () => Promise.reject(new Error('server error')) })
    renderDialog()

    fireEvent.click(screen.getByTestId('space-confirm-leave-button'))

    await waitFor(() => {
      expect(screen.getByText('Error leaving the workspace. Please try again.')).toBeInTheDocument()
    })
  })

  it('does not redirect when leaving fails', async () => {
    mockLeaveSpace.mockReturnValue({ unwrap: () => Promise.reject(new Error('fail')) })
    renderDialog()

    fireEvent.click(screen.getByTestId('space-confirm-leave-button'))

    await waitFor(() => {
      expect(screen.getByText('Error leaving the workspace. Please try again.')).toBeInTheDocument()
    })
    expect(mockRouterPush).not.toHaveBeenCalled()
  })

  it('calls onClose when Cancel is clicked', () => {
    const onClose = jest.fn()
    renderDialog({ onClose })

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))

    expect(onClose).toHaveBeenCalled()
  })

  it('disables both buttons and shows loading label while the mutation is in flight', () => {
    mockIsLoading = true
    renderDialog()

    expect(screen.getByTestId('space-confirm-leave-button')).toBeDisabled()
    expect(screen.getByTestId('space-confirm-leave-button')).toHaveTextContent('Leaving…')
    expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled()
  })
})
