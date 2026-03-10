import { fireEvent, waitFor, screen, render as rtlRender } from '@testing-library/react'
import { render } from '@/tests/test-utils'
import { Provider } from 'react-redux'
import { makeStore } from '@/store'
import type { RootState } from '@/store'
import { initialState as settingsInitialState } from '@/store/settingsSlice'
import EnvironmentVariables from '..'
import { faker } from '@faker-js/faker'
import { chainBuilder } from '@/tests/builders/chains'
import * as analytics from '@/services/analytics'
import SafeThemeProvider from '@/components/theme/SafeThemeProvider'
import { ThemeProvider } from '@mui/material/styles'
import type { Theme } from '@mui/material/styles'

// Mock chain data
const mockChain = chainBuilder()
  .with({ chainId: '1', shortName: 'eth' })
  .with({ rpcUri: { authentication: 'NO_AUTHENTICATION', value: 'https://mainnet.infura.io/v3/' } })
  .build()

// Mock hooks
jest.mock('@/hooks/useChainId', () => ({
  __esModule: true,
  default: jest.fn(() => '1'),
}))

jest.mock('@/hooks/useChains', () => ({
  useCurrentChain: jest.fn(() => mockChain),
}))

// Mock analytics
jest.mock('@/services/analytics', () => ({
  trackEvent: jest.fn(),
  SETTINGS_EVENTS: {
    ENV_VARIABLES: {
      SAVE: { category: 'settings', action: 'env_variables_save' },
    },
  },
}))

// Helper function to render with store access
const renderWithStore = (ui: React.ReactElement, initialReduxState?: Partial<RootState>) => {
  const store = makeStore(initialReduxState, { skipBroadcast: true })
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

describe('EnvironmentVariables', () => {
  const mockRpcUrl = faker.internet.url()
  const mockTenderlyUrl = faker.internet.url()
  const mockTenderlyToken = faker.string.alphanumeric(32)

  beforeEach(() => {
    jest.clearAllMocks()
    // Mock location.reload
    delete (window as any).location
    window.location = { reload: jest.fn() } as any
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should render with empty initial values', () => {
    render(<EnvironmentVariables />, {
      initialReduxState: {
        settings: {
          ...settingsInitialState,
          env: {
            rpc: {},
            tenderly: { url: '', accessToken: '' },
          },
        },
      },
    })

    // Check placeholder text is visible
    expect(screen.getByPlaceholderText(mockChain.rpcUri.value)).toBeInTheDocument()
  })

  it('should render with existing Redux values', () => {
    render(<EnvironmentVariables />, {
      initialReduxState: {
        settings: {
          ...settingsInitialState,
          env: {
            rpc: { '1': mockRpcUrl },
            tenderly: { url: mockTenderlyUrl, accessToken: mockTenderlyToken },
          },
        },
      },
    })

    const rpcInput = screen.getByPlaceholderText(mockChain.rpcUri.value) as HTMLInputElement
    const tenderlyUrlInput = screen.getByLabelText('Tenderly API URL') as HTMLInputElement
    const tenderlyTokenInput = screen.getByLabelText('Tenderly access token') as HTMLInputElement

    expect(rpcInput).toHaveValue(mockRpcUrl)
    expect(tenderlyUrlInput).toHaveValue(mockTenderlyUrl)
    expect(tenderlyTokenInput).toHaveValue(mockTenderlyToken)
  })

  it('should allow user to input RPC URL', async () => {
    render(<EnvironmentVariables />, {
      initialReduxState: {
        settings: {
          ...settingsInitialState,
          env: { rpc: {}, tenderly: { url: '', accessToken: '' } },
        },
      },
    })

    const rpcInput = screen.getByPlaceholderText(mockChain.rpcUri.value) as HTMLInputElement

    fireEvent.change(rpcInput, { target: { value: mockRpcUrl } })

    await waitFor(() => {
      expect(rpcInput).toHaveValue(mockRpcUrl)
    })
  })

  it('should show reset button when value is entered', async () => {
    render(<EnvironmentVariables />, {
      initialReduxState: {
        settings: {
          ...settingsInitialState,
          env: { rpc: {}, tenderly: { url: '', accessToken: '' } },
        },
      },
    })

    const rpcInput = screen.getByPlaceholderText(mockChain.rpcUri.value) as HTMLInputElement

    // Initially no reset button
    expect(screen.queryAllByLabelText('Reset to default value')).toHaveLength(0)

    // Enter value
    fireEvent.change(rpcInput, { target: { value: mockRpcUrl } })

    // Reset button should appear
    await waitFor(() => {
      expect(screen.getAllByLabelText('Reset to default value').length).toBeGreaterThan(0)
    })
  })

  it('should clear input when reset button is clicked', async () => {
    render(<EnvironmentVariables />, {
      initialReduxState: {
        settings: {
          ...settingsInitialState,
          env: { rpc: { '1': mockRpcUrl }, tenderly: { url: '', accessToken: '' } },
        },
      },
    })

    const rpcInput = screen.getByPlaceholderText(mockChain.rpcUri.value) as HTMLInputElement
    expect(rpcInput).toHaveValue(mockRpcUrl)

    // Click reset button
    const resetButtons = screen.getAllByLabelText('Reset to default value')
    fireEvent.click(resetButtons[0])

    await waitFor(() => {
      expect(rpcInput).toHaveValue('')
    })
  })

  it('should save settings and reload page on submit', async () => {
    const { store } = renderWithStore(<EnvironmentVariables />, {
      settings: {
        ...settingsInitialState,
        env: { rpc: {}, tenderly: { url: '', accessToken: '' } },
      },
    })

    // Fill in values
    const rpcInput = screen.getByPlaceholderText(mockChain.rpcUri.value) as HTMLInputElement
    const tenderlyUrlInput = screen.getByLabelText('Tenderly API URL') as HTMLInputElement
    const tenderlyTokenInput = screen.getByLabelText('Tenderly access token') as HTMLInputElement

    fireEvent.change(rpcInput, { target: { value: mockRpcUrl } })
    fireEvent.change(tenderlyUrlInput, { target: { value: mockTenderlyUrl } })
    fireEvent.change(tenderlyTokenInput, { target: { value: mockTenderlyToken } })

    // Submit form
    const saveButton = screen.getByText('Save')
    fireEvent.click(saveButton)

    await waitFor(() => {
      // Check Redux state was updated
      const state = store.getState()
      expect(state.settings.env.rpc['1']).toBe(mockRpcUrl)
      expect(state.settings.env.tenderly.url).toBe(mockTenderlyUrl)
      expect(state.settings.env.tenderly.accessToken).toBe(mockTenderlyToken)

      // Check that location.reload was called
      expect(window.location.reload).toHaveBeenCalled()
    })
  })

  it('should track analytics event on save', async () => {
    render(<EnvironmentVariables />, {
      initialReduxState: {
        settings: {
          ...settingsInitialState,
          env: { rpc: {}, tenderly: { url: '', accessToken: '' } },
        },
      },
    })

    const saveButton = screen.getByText('Save')
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(analytics.trackEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'settings',
          action: 'env_variables_save',
        }),
      )
    })
  })

  it('should allow clearing all inputs', async () => {
    render(<EnvironmentVariables />, {
      initialReduxState: {
        settings: {
          ...settingsInitialState,
          env: {
            rpc: { '1': mockRpcUrl },
            tenderly: { url: mockTenderlyUrl, accessToken: mockTenderlyToken },
          },
        },
      },
    })

    const rpcInput = screen.getByPlaceholderText(mockChain.rpcUri.value) as HTMLInputElement
    const tenderlyUrlInput = screen.getByLabelText('Tenderly API URL') as HTMLInputElement
    const tenderlyTokenInput = screen.getByLabelText('Tenderly access token') as HTMLInputElement

    // All inputs should have values
    expect(rpcInput).toHaveValue(mockRpcUrl)
    expect(tenderlyUrlInput).toHaveValue(mockTenderlyUrl)
    expect(tenderlyTokenInput).toHaveValue(mockTenderlyToken)

    // Click all reset buttons
    const resetButtons = screen.getAllByLabelText('Reset to default value')
    resetButtons.forEach((button) => fireEvent.click(button))

    await waitFor(() => {
      expect(rpcInput).toHaveValue('')
      expect(tenderlyUrlInput).toHaveValue('')
      expect(tenderlyTokenInput).toHaveValue('')
    })
  })
})
