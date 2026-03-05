import { fireEvent, waitFor, screen, render as rtlRender } from '@testing-library/react'
import { Provider } from 'react-redux'
import { makeStore } from '@/store'
import SafeThemeProvider from '@/components/theme/SafeThemeProvider'
import { ThemeProvider } from '@mui/material/styles'
import type { Theme } from '@mui/material/styles'
import { CookieAndTermBanner } from '../index'
import { CookieAndTermType } from '@/store/cookiesAndTermsSlice'
import * as metadata from '@/markdown/terms/version'

// Mock next/router
const mockPush = jest.fn()
const mockPathname = '/home'

jest.mock('next/router', () => ({
  useRouter: () => ({
    pathname: mockPathname,
    push: mockPush,
    query: {},
  }),
}))

// Helper to render with Redux store
const renderWithStore = (ui: React.ReactElement, preloadedState?: any) => {
  const store = makeStore(preloadedState, { skipBroadcast: true })
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

describe('CookieAndTermBanner', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Basic rendering', () => {
    it('should render all cookie options', () => {
      renderWithStore(<CookieAndTermBanner />)

      expect(screen.getByText('Necessary')).toBeInTheDocument()
      expect(screen.getByText('Beamer')).toBeInTheDocument()
      expect(screen.getByText('Analytics')).toBeInTheDocument()
    })

    it('should display intro text with terms link', () => {
      renderWithStore(<CookieAndTermBanner />)

      expect(screen.getByText(/By browsing this page, you accept our/)).toBeInTheDocument()
      expect(screen.getByText('Terms & Conditions')).toBeInTheDocument()
      expect(screen.getByText(/last updated/)).toBeInTheDocument()
      expect(screen.getByText('Cookie policy')).toBeInTheDocument()
    })

    it('should display both action buttons', () => {
      renderWithStore(<CookieAndTermBanner />)

      expect(screen.getByText('Save settings')).toBeInTheDocument()
      expect(screen.getByText('Accept all')).toBeInTheDocument()
    })

    it('should display warning message when warningKey is provided', () => {
      renderWithStore(<CookieAndTermBanner warningKey={CookieAndTermType.UPDATES} />)

      expect(
        screen.getByText(
          /You attempted to open the "What's new" section but need to accept the "Beamer" cookies first/,
        ),
      ).toBeInTheDocument()
    })

    it('should not display warning message when warningKey is not provided', () => {
      renderWithStore(<CookieAndTermBanner />)

      expect(screen.queryByText(/You attempted to open the "What's new" section/)).not.toBeInTheDocument()
    })

    it('should apply inverted class when inverted prop is true', () => {
      const { container } = renderWithStore(<CookieAndTermBanner inverted />)

      const paper = container.querySelector('[data-testid="cookies-popup"]')
      expect(paper).toHaveClass('inverted')
    })
  })

  describe('Cookie options state', () => {
    it('should have necessary cookie checkbox disabled and checked', () => {
      renderWithStore(<CookieAndTermBanner />)

      const necessaryCheckbox = screen.getByRole('checkbox', { name: /Necessary/ })
      expect(necessaryCheckbox).toBeDisabled()
      expect(necessaryCheckbox).toBeChecked()
    })

    it('should load saved cookie preferences from store', () => {
      const preloadedState = {
        cookies_terms: {
          [CookieAndTermType.TERMS]: true,
          [CookieAndTermType.NECESSARY]: true,
          [CookieAndTermType.UPDATES]: true,
          [CookieAndTermType.ANALYTICS]: false,
          termsVersion: metadata.version,
        },
      }

      renderWithStore(<CookieAndTermBanner />, preloadedState)

      const beamerCheckbox = screen.getByRole('checkbox', { name: /Beamer/ })
      const analyticsCheckbox = screen.getByRole('checkbox', { name: /Analytics/ })

      expect(beamerCheckbox).toBeChecked()
      expect(analyticsCheckbox).not.toBeChecked()
    })

    it('should allow toggling Beamer checkbox', () => {
      renderWithStore(<CookieAndTermBanner />)

      const beamerCheckbox = screen.getByRole('checkbox', { name: /Beamer/ })
      expect(beamerCheckbox).not.toBeChecked()

      fireEvent.click(beamerCheckbox)
      expect(beamerCheckbox).toBeChecked()

      fireEvent.click(beamerCheckbox)
      expect(beamerCheckbox).not.toBeChecked()
    })

    it('should allow toggling Analytics checkbox', () => {
      renderWithStore(<CookieAndTermBanner />)

      const analyticsCheckbox = screen.getByRole('checkbox', { name: /Analytics/ })
      expect(analyticsCheckbox).not.toBeChecked()

      fireEvent.click(analyticsCheckbox)
      expect(analyticsCheckbox).toBeChecked()

      fireEvent.click(analyticsCheckbox)
      expect(analyticsCheckbox).not.toBeChecked()
    })

    it('should check warning cookie when warningKey is provided', () => {
      renderWithStore(<CookieAndTermBanner warningKey={CookieAndTermType.UPDATES} />)

      const beamerCheckbox = screen.getByRole('checkbox', { name: /Beamer/ })
      expect(beamerCheckbox).toBeChecked()
    })
  })

  describe('User interactions', () => {
    it('should save selected cookie preferences on "Save settings" click', async () => {
      const { store } = renderWithStore(<CookieAndTermBanner />)

      const beamerCheckbox = screen.getByRole('checkbox', { name: /Beamer/ })
      const saveButton = screen.getByText('Save settings')

      // Select only Beamer
      fireEvent.click(beamerCheckbox)

      fireEvent.click(saveButton)

      await waitFor(() => {
        const state = store.getState()
        expect(state.cookies_terms[CookieAndTermType.UPDATES]).toBe(true)
        expect(state.cookies_terms[CookieAndTermType.ANALYTICS]).toBe(false)
      })
    })

    it('should accept all cookies on "Accept all" click', async () => {
      const { store } = renderWithStore(<CookieAndTermBanner />)

      const acceptAllButton = screen.getByText('Accept all')

      fireEvent.click(acceptAllButton)

      await waitFor(() => {
        const state = store.getState()
        expect(state.cookies_terms[CookieAndTermType.UPDATES]).toBe(true)
        expect(state.cookies_terms[CookieAndTermType.ANALYTICS]).toBe(true)
      })
    })

    it('should close banner after saving settings', async () => {
      const { store } = renderWithStore(<CookieAndTermBanner />)

      const saveButton = screen.getByText('Save settings')

      fireEvent.click(saveButton)

      await waitFor(() => {
        const state = store.getState()
        expect(state.popups.cookies.open).toBe(false)
      })
    })

    it('should close banner after accepting all', async () => {
      const { store } = renderWithStore(<CookieAndTermBanner />)

      const acceptAllButton = screen.getByText('Accept all')

      fireEvent.click(acceptAllButton)

      await waitFor(() => {
        const state = store.getState()
        expect(state.popups.cookies.open).toBe(false)
      })
    })

    it('should save terms version when accepting settings', async () => {
      const { store } = renderWithStore(<CookieAndTermBanner />)

      const saveButton = screen.getByText('Save settings')

      fireEvent.click(saveButton)

      await waitFor(() => {
        const state = store.getState()
        expect(state.cookies_terms.termsVersion).toBe(metadata.version)
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper labels for all checkboxes', () => {
      renderWithStore(<CookieAndTermBanner />)

      expect(screen.getByLabelText('Necessary')).toBeInTheDocument()
      expect(screen.getByLabelText('Beamer')).toBeInTheDocument()
      expect(screen.getByLabelText('Analytics')).toBeInTheDocument()
    })

    it('should have descriptions for each cookie type', () => {
      renderWithStore(<CookieAndTermBanner />)

      expect(screen.getByText('Locally stored data for core functionality')).toBeInTheDocument()
      expect(screen.getByText('New features and product announcements')).toBeInTheDocument()
      expect(screen.getByText('Analytics tools to understand usage patterns.')).toBeInTheDocument()
    })
  })
})
