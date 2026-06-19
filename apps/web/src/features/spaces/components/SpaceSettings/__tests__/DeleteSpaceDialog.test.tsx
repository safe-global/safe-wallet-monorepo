import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { Provider } from 'react-redux'
import { makeStore } from '@/store'
import DeleteSpaceDialog from '../DeleteSpaceDialog'
import type { GetSpaceResponse } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { AppRoutes } from '@/config/routes'
const MOCK_SPACE_UUID = '11111111-1111-1111-1111-111111111111'

const mockDeleteSpace = jest.fn()
const mockRouterPush = jest.fn()

jest.mock('@safe-global/store/gateway/AUTO_GENERATED/spaces', () => ({
  useSpacesDeleteV1Mutation: jest.fn(() => [mockDeleteSpace, { isLoading: false }]),
}))

jest.mock('next/router', () => ({
  useRouter: () => ({ push: mockRouterPush }),
}))

jest.mock('@/services/analytics', () => ({
  trackEvent: jest.fn(),
}))

const mockSpace: GetSpaceResponse = {
  uuid: MOCK_SPACE_UUID,
  name: 'My Workspace',
  members: [],
  memberCount: 0,
  safeCount: 0,
}

const renderDialog = (space = mockSpace, onClose = jest.fn()) => {
  const store = makeStore(undefined, { skipBroadcast: true })
  return {
    store,
    onClose,
    ...render(
      <Provider store={store}>
        <DeleteSpaceDialog space={space} onClose={onClose} />
      </Provider>,
    ),
  }
}

describe('DeleteSpaceDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockDeleteSpace.mockReset()
  })

  it('renders the dialog with space name in the confirmation label', () => {
    renderDialog()
    expect(screen.getByText(/My Workspace/)).toBeInTheDocument()
  })

  it('confirm button is disabled when the input is empty', () => {
    renderDialog()
    expect(screen.getByTestId('space-confirm-delete-button')).toBeDisabled()
  })

  it('confirm button is disabled when the name is typed incorrectly', () => {
    renderDialog()
    fireEvent.change(screen.getByTestId('space-confirm-name-input'), {
      target: { value: 'wrong name' },
    })
    expect(screen.getByTestId('space-confirm-delete-button')).toBeDisabled()
  })

  it('confirm button is enabled when name matches with leading/trailing whitespace', () => {
    renderDialog()
    fireEvent.change(screen.getByTestId('space-confirm-name-input'), {
      target: { value: '  My Workspace  ' },
    })
    expect(screen.getByTestId('space-confirm-delete-button')).not.toBeDisabled()
  })

  it('confirm button is enabled only when the name matches exactly', () => {
    renderDialog()
    fireEvent.change(screen.getByTestId('space-confirm-name-input'), {
      target: { value: 'My Workspace' },
    })
    expect(screen.getByTestId('space-confirm-delete-button')).not.toBeDisabled()
  })

  it('calls deleteSpace with the space id on confirm', async () => {
    mockDeleteSpace.mockReturnValue({ unwrap: () => Promise.resolve() })
    renderDialog()

    fireEvent.change(screen.getByTestId('space-confirm-name-input'), {
      target: { value: 'My Workspace' },
    })
    fireEvent.click(screen.getByTestId('space-confirm-delete-button'))

    await waitFor(() => {
      expect(mockDeleteSpace).toHaveBeenCalledWith({ id: MOCK_SPACE_UUID })
    })
  })

  it('redirects to the spaces welcome page after successful deletion', async () => {
    mockDeleteSpace.mockReturnValue({ unwrap: () => Promise.resolve() })
    renderDialog()

    fireEvent.change(screen.getByTestId('space-confirm-name-input'), {
      target: { value: 'My Workspace' },
    })
    fireEvent.click(screen.getByTestId('space-confirm-delete-button'))

    await waitFor(() => {
      expect(mockRouterPush).toHaveBeenCalledWith({ pathname: AppRoutes.welcome.spaces })
    })
  })

  it('dispatches a success notification after deletion', async () => {
    mockDeleteSpace.mockReturnValue({ unwrap: () => Promise.resolve() })
    const { store } = renderDialog()

    fireEvent.change(screen.getByTestId('space-confirm-name-input'), {
      target: { value: 'My Workspace' },
    })
    fireEvent.click(screen.getByTestId('space-confirm-delete-button'))

    await waitFor(() => {
      const notifications = store.getState().notifications
      expect(notifications.length).toBeGreaterThan(0)
      const last = notifications[notifications.length - 1]
      expect(last.message).toBe('Deleted workspace My Workspace.')
      expect(last.variant).toBe('success')
    })
  })

  it('shows an error message when deletion fails', async () => {
    mockDeleteSpace.mockReturnValue({ unwrap: () => Promise.reject(new Error('server error')) })
    renderDialog()

    fireEvent.change(screen.getByTestId('space-confirm-name-input'), {
      target: { value: 'My Workspace' },
    })
    fireEvent.click(screen.getByTestId('space-confirm-delete-button'))

    await waitFor(() => {
      expect(screen.getByText('Error deleting the workspace. Please try again.')).toBeInTheDocument()
    })
  })

  it('does not redirect when deletion fails', async () => {
    mockDeleteSpace.mockReturnValue({ unwrap: () => Promise.reject(new Error('fail')) })
    renderDialog()

    fireEvent.change(screen.getByTestId('space-confirm-name-input'), {
      target: { value: 'My Workspace' },
    })
    fireEvent.click(screen.getByTestId('space-confirm-delete-button'))

    await waitFor(() => {
      expect(screen.getByText('Error deleting the workspace. Please try again.')).toBeInTheDocument()
    })
    expect(mockRouterPush).not.toHaveBeenCalled()
  })

  it('calls onClose when Cancel is clicked', () => {
    const onClose = jest.fn()
    renderDialog(mockSpace, onClose)

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))

    expect(onClose).toHaveBeenCalled()
  })

  it('confirm button is disabled when space is undefined', () => {
    renderDialog(undefined)
    expect(screen.getByTestId('space-confirm-delete-button')).toBeDisabled()
  })
})
