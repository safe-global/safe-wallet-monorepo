import { fireEvent, waitFor, screen, render as rtlRender } from '@testing-library/react'
import { Provider } from 'react-redux'
import { makeStore } from '@/store'
import SafeThemeProvider from '@/components/theme/SafeThemeProvider'
import { ThemeProvider } from '@mui/material/styles'
import type { Theme } from '@mui/material/styles'
import UpdateSpaceForm from '../UpdateSpaceForm'

// Import the real type
import type { GetSpaceResponse } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'

// Mock the hooks
const mockUpdateSpace = jest.fn()
const mockUseIsAdmin = jest.fn()

jest.mock('@/features/spaces/hooks/useSpaceMembers', () => ({
  useIsAdmin: jest.fn(() => mockUseIsAdmin()),
}))

jest.mock('@safe-global/store/gateway/AUTO_GENERATED/spaces', () => ({
  useSpacesUpdateV1Mutation: jest.fn(() => [mockUpdateSpace]),
}))

// Helper to render with Redux store
const renderWithStore = (ui: React.ReactElement) => {
  const store = makeStore(undefined, { skipBroadcast: true })
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>
      <SafeThemeProvider mode="light">
        {(safeTheme: Theme) => <ThemeProvider theme={safeTheme}>{children}</ThemeProvider>}
      </SafeThemeProvider>
    </Provider>
  )
  const result = rtlRender(ui, { wrapper })
  return { ...result, store }
}

describe('UpdateSpaceForm', () => {
  const mockSpace: GetSpaceResponse = {
    id: 123,
    name: 'Test Space',
    status: 'ACTIVE',
    members: [],
  }

  // Helper functions to reduce code duplication
  const setupForm = (space: GetSpaceResponse | undefined, isAdmin: boolean) => {
    mockUseIsAdmin.mockReturnValue(isAdmin)
    return renderWithStore(<UpdateSpaceForm space={space} />)
  }

  const getFormElements = () => ({
    input: screen.getByLabelText('Space name') as HTMLInputElement,
    saveButton: screen.getByTestId('space-save-button'),
  })

  const changeSpaceName = (newName: string) => {
    const { input } = getFormElements()
    fireEvent.change(input, { target: { value: newName } })
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockUpdateSpace.mockReset()
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
    mockUpdateSpace.mockResolvedValue({})
    setupForm(mockSpace, true)

    changeSpaceName('New Space Name')

    const { saveButton } = getFormElements()
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(mockUpdateSpace).toHaveBeenCalledWith({
        id: 123,
        updateSpaceDto: { name: 'New Space Name' },
      })
    })
  })

  it('should show success notification on successful update', async () => {
    mockUpdateSpace.mockResolvedValue({})
    const { store } = setupForm(mockSpace, true)

    changeSpaceName('New Space Name')

    const { saveButton } = getFormElements()
    fireEvent.click(saveButton)

    await waitFor(() => {
      const state = store.getState()
      const notifications = state.notifications
      expect(notifications.length).toBeGreaterThan(0)
      const lastNotification = notifications[notifications.length - 1]
      expect(lastNotification.message).toBe('Updated space name')
      expect(lastNotification.variant).toBe('success')
      expect(lastNotification.groupKey).toBe('space-update-name')
    })
  })

  it('should display error message when update fails', async () => {
    mockUpdateSpace.mockRejectedValue(new Error('Network error'))
    setupForm(mockSpace, true)

    changeSpaceName('New Space Name')

    const { saveButton } = getFormElements()
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(screen.getByText('Error updating the space. Please try again.')).toBeInTheDocument()
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
    mockUpdateSpace.mockRejectedValueOnce(new Error('Network error')).mockResolvedValueOnce({})
    setupForm(mockSpace, true)

    // First attempt fails
    changeSpaceName('New Name')
    const { saveButton } = getFormElements()
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(screen.getByText('Error updating the space. Please try again.')).toBeInTheDocument()
    })

    // Second attempt succeeds
    changeSpaceName('Another Name')
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(screen.queryByText('Error updating the space. Please try again.')).not.toBeInTheDocument()
    })
  })
})
