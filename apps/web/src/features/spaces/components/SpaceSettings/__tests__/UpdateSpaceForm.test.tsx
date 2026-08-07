import { fireEvent, waitFor, screen, render as rtlRender } from '@testing-library/react'
import { Provider } from 'react-redux'
import { makeStore } from '@/store'
import UpdateSpaceForm from '../UpdateSpaceForm'

import type { GetSpaceResponse } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { spaceBuilder } from '@/tests/builders/space'
import { SPACE_NAME_MAX_LENGTH } from '@/features/spaces/constants'
const MOCK_SPACE_UUID = '11111111-1111-1111-1111-111111111111'

const mockUnwrap = jest.fn()
const mockUpdateSpace = jest.fn(() => ({ unwrap: mockUnwrap }))
const mockUseIsAdmin = jest.fn()

jest.mock('@/features/spaces/hooks/useSpaceMembers', () => ({
  useIsAdmin: jest.fn(() => mockUseIsAdmin()),
}))

jest.mock('@safe-global/store/gateway/AUTO_GENERATED/spaces', () => ({
  useSpacesUpdateV1Mutation: jest.fn(() => [mockUpdateSpace]),
}))

// Helper to render with a specific store instance for notification assertions
const renderWithStore = (ui: React.ReactElement) => {
  const store = makeStore(undefined, { skipBroadcast: true })
  const result = rtlRender(ui, {
    wrapper: ({ children }: { children: React.ReactNode }) => <Provider store={store}>{children}</Provider>,
  })
  return { ...result, store }
}

describe('UpdateSpaceForm', () => {
  const mockSpace = spaceBuilder().with({ uuid: MOCK_SPACE_UUID, name: 'Test Space', members: [] }).build()

  // Helper functions to reduce code duplication
  const setupForm = (space: GetSpaceResponse | undefined, isAdmin: boolean, onClose?: () => void) => {
    mockUseIsAdmin.mockReturnValue(isAdmin)
    return renderWithStore(<UpdateSpaceForm space={space} onClose={onClose} />)
  }

  const getFormElements = () => ({
    input: screen.getByRole('textbox', { name: /workspace name/i }) as HTMLInputElement,
    saveButton: screen.getByTestId('space-save-button'),
  })

  const changeSpaceName = (newName: string) => {
    const { input } = getFormElements()
    fireEvent.change(input, { target: { value: newName } })
  }

  const changeSpaceNameAndAwaitValid = async (newName: string) => {
    changeSpaceName(newName)
    await waitFor(() => {
      expect(getFormElements().saveButton).not.toBeDisabled()
    })
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockUnwrap.mockReset()
    mockUseIsAdmin.mockReset()
  })

  it('should render with space data', () => {
    setupForm(mockSpace, true)

    const { input } = getFormElements()
    expect(input).toHaveValue('Test Space')
  })

  it('should render empty when no space is provided', () => {
    setupForm(undefined, false)

    const { input } = getFormElements()
    expect(input).toHaveValue('')
  })

  it('should allow user to change space name', async () => {
    setupForm(mockSpace, true)

    changeSpaceName('Updated Space Name')

    await waitFor(() => {
      const { input } = getFormElements()
      expect(input).toHaveValue('Updated Space Name')
    })
  })

  it('should disable save and show an error when the name exceeds the maximum length', async () => {
    setupForm(mockSpace, true)

    changeSpaceName('a'.repeat(SPACE_NAME_MAX_LENGTH + 1))

    await waitFor(() => {
      expect(getFormElements().saveButton).toBeDisabled()
    })
    expect(screen.getByText(`Names must be at most ${SPACE_NAME_MAX_LENGTH} characters long`)).toBeInTheDocument()
  })

  it('should disable save button when name is unchanged', () => {
    setupForm(mockSpace, true)

    const { saveButton } = getFormElements()
    expect(saveButton).toBeDisabled()
  })

  it('should enable save button when name is changed and user is admin', async () => {
    setupForm(mockSpace, true)

    changeSpaceName('New Name')

    await waitFor(() => {
      const { saveButton } = getFormElements()
      expect(saveButton).not.toBeDisabled()
    })
  })

  it('should disable save button when user is not admin', () => {
    setupForm(mockSpace, false)

    changeSpaceName('New Name')

    const { saveButton } = getFormElements()
    expect(saveButton).toBeDisabled()
  })

  it('should call updateSpace mutation on submit', async () => {
    mockUnwrap.mockResolvedValue({})
    setupForm(mockSpace, true)

    await changeSpaceNameAndAwaitValid('New Space Name')

    const { saveButton } = getFormElements()
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(mockUpdateSpace).toHaveBeenCalledWith({
        id: MOCK_SPACE_UUID,
        updateSpaceDto: { name: 'New Space Name' },
      })
    })
  })

  it('should show success notification on successful update', async () => {
    mockUnwrap.mockResolvedValue({})
    const { store } = setupForm(mockSpace, true)

    await changeSpaceNameAndAwaitValid('New Space Name')

    const { saveButton } = getFormElements()
    fireEvent.click(saveButton)

    await waitFor(() => {
      const state = store.getState()
      const notifications = state.notifications
      expect(notifications.length).toBeGreaterThan(0)
      const lastNotification = notifications[notifications.length - 1]
      expect(lastNotification.message).toBe('Updated workspace name')
      expect(lastNotification.variant).toBe('success')
      expect(lastNotification.groupKey).toBe('space-update-name')
    })
  })

  it('should call onClose after a successful update', async () => {
    mockUnwrap.mockResolvedValue({})
    const onClose = jest.fn()
    setupForm(mockSpace, true, onClose)

    await changeSpaceNameAndAwaitValid('New Space Name')

    const { saveButton } = getFormElements()
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1)
    })
  })

  it('should not call onClose when the update fails', async () => {
    mockUnwrap.mockRejectedValue({ status: 422, data: { message: 'Name contains invalid characters' } })
    const onClose = jest.fn()
    setupForm(mockSpace, true, onClose)

    await changeSpaceNameAndAwaitValid('New Space Name')

    const { saveButton } = getFormElements()
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(screen.getByText('Name contains invalid characters')).toBeInTheDocument()
    })
    expect(onClose).not.toHaveBeenCalled()
  })

  it('should display the backend error message when update fails', async () => {
    mockUnwrap.mockRejectedValue({ status: 422, data: { message: 'Name contains invalid characters' } })
    setupForm(mockSpace, true)

    await changeSpaceNameAndAwaitValid('New Space Name')

    const { saveButton } = getFormElements()
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(screen.getByText('Name contains invalid characters')).toBeInTheDocument()
    })
  })

  it('should not call updateSpace when space is undefined', async () => {
    setupForm(undefined, true)

    changeSpaceName('Some Name')

    const { saveButton } = getFormElements()
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(mockUpdateSpace).not.toHaveBeenCalled()
    })
  })

  it('should clear error message when user retries after error', async () => {
    mockUnwrap
      .mockRejectedValueOnce({ status: 422, data: { message: 'Name contains invalid characters' } })
      .mockResolvedValueOnce({})
    setupForm(mockSpace, true)

    // First attempt fails
    await changeSpaceNameAndAwaitValid('New Name')
    const { saveButton } = getFormElements()
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(screen.getByText('Name contains invalid characters')).toBeInTheDocument()
    })

    // Second attempt succeeds
    await changeSpaceNameAndAwaitValid('Another Name')
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(screen.queryByText('Name contains invalid characters')).not.toBeInTheDocument()
    })
  })
})
