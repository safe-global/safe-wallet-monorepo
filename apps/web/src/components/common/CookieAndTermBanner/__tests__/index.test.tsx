import { fireEvent, waitFor, screen, within, render as rtlRender } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from 'react-redux'
import { makeStore } from '@/store'
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
  const wrapper = ({ children }: { children: React.ReactNode }) => <Provider store={store}>{children}</Provider>
  const result = rtlRender(ui, { wrapper })
  return { ...result, store }
}

// Base UI's Checkbox renders a <span role="checkbox"> and overrides the `id` it
// is given, so the wrapping <label htmlFor> no longer associates a name with it.
// Locate each checkbox by scoping to the label that contains its text instead.
const getCheckboxByLabel = (label: string | RegExp): HTMLElement => {
  const labelEl = screen.getByText(label).closest('label')
  if (!labelEl) throw new Error(`No label found for ${label}`)
  return within(labelEl).getByRole('checkbox')
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

      const necessaryCheckbox = getCheckboxByLabel('Necessary')
      expect(necessaryCheckbox).toHaveAttribute('aria-disabled', 'true')
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

      const beamerCheckbox = getCheckboxByLabel('Beamer')
      const analyticsCheckbox = getCheckboxByLabel('Analytics')

      expect(beamerCheckbox).toBeChecked()
      expect(analyticsCheckbox).not.toBeChecked()
    })

    it('should allow toggling Beamer checkbox', async () => {
      renderWithStore(<CookieAndTermBanner />)

      const beamerCheckbox = getCheckboxByLabel('Beamer')
      expect(beamerCheckbox).not.toBeChecked()

      await userEvent.click(beamerCheckbox)
      expect(beamerCheckbox).toBeChecked()

      await userEvent.click(beamerCheckbox)
      expect(beamerCheckbox).not.toBeChecked()
    })

    it('should allow toggling Analytics checkbox', async () => {
      renderWithStore(<CookieAndTermBanner />)

      const analyticsCheckbox = getCheckboxByLabel('Analytics')
      expect(analyticsCheckbox).not.toBeChecked()

      await userEvent.click(analyticsCheckbox)
      expect(analyticsCheckbox).toBeChecked()

      await userEvent.click(analyticsCheckbox)
      expect(analyticsCheckbox).not.toBeChecked()
    })

    it('should check warning cookie when warningKey is provided', () => {
      renderWithStore(<CookieAndTermBanner warningKey={CookieAndTermType.UPDATES} />)

      const beamerCheckbox = getCheckboxByLabel('Beamer')
      expect(beamerCheckbox).toBeChecked()
    })
  })

  describe('User interactions', () => {
    it('should save selected cookie preferences on "Save settings" click', async () => {
      const { store } = renderWithStore(<CookieAndTermBanner />)

      const beamerCheckbox = getCheckboxByLabel('Beamer')
      const saveButton = screen.getByText('Save settings')

      // Select only Beamer
      await userEvent.click(beamerCheckbox)

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

      // Each checkbox lives inside a <label> carrying its visible text.
      expect(getCheckboxByLabel('Necessary')).toBeInTheDocument()
      expect(getCheckboxByLabel('Beamer')).toBeInTheDocument()
      expect(getCheckboxByLabel('Analytics')).toBeInTheDocument()
    })

    it('should have descriptions for each cookie type', () => {
      renderWithStore(<CookieAndTermBanner />)

      expect(screen.getByText('Locally stored data for core functionality')).toBeInTheDocument()
      expect(screen.getByText('New features and product announcements')).toBeInTheDocument()
      expect(screen.getByText('Analytics tools to understand usage patterns.')).toBeInTheDocument()
    })
  })
})
