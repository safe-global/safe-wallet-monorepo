import { render, screen } from '@/tests/test-utils'
import { HnBanner } from './HnBanner'
import { HnBannerWithLocalStorage } from './HnBannerWithLocalStorage'
import { HnBannerWithLocalStorageVisibility } from './index'
import { HN_BANNER_LS_KEY } from './constants'
import local from '@/services/local-storage/local'
import * as useIsHypernativeFeatureHook from '../../hooks/useIsHypernativeFeature'
import * as useLocalStorageHook from '@/services/local-storage/useLocalStorage'

// Mock HnSignupFlow to avoid rendering the actual modal in tests
jest.mock('../HnSignupFlow', () => ({
  HnSignupFlow: ({ open }: { open: boolean }) => (open ? <div data-testid="hn-signup-flow" /> : null),
}))

describe('HnBanner', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    window.localStorage.clear()
    local.removeItem(HN_BANNER_LS_KEY)
  })

  afterEach(() => {
    window.localStorage.clear()
    local.removeItem(HN_BANNER_LS_KEY)
  })

  describe('HnBanner', () => {
    it('renders title and CTA', () => {
      const mockOnHnSignupClick = jest.fn()
      render(<HnBanner onHnSignupClick={mockOnHnSignupClick} />)

      expect(screen.getByText('Strengthen your Safe')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Learn more' })).toBeInTheDocument()
    })

    it('renders dismiss button when onDismiss is provided', () => {
      const mockOnHnSignupClick = jest.fn()
      const mockOnDismiss = jest.fn()
      render(<HnBanner onHnSignupClick={mockOnHnSignupClick} onDismiss={mockOnDismiss} />)

      const dismissButton = screen.getByRole('button', { name: 'close' })
      expect(dismissButton).toBeInTheDocument()
    })

    it('does not render dismiss button when onDismiss is not provided', () => {
      const mockOnHnSignupClick = jest.fn()
      render(<HnBanner onHnSignupClick={mockOnHnSignupClick} />)

      const dismissButton = screen.queryByRole('button', { name: 'close' })
      expect(dismissButton).not.toBeInTheDocument()
    })
  })

  describe('HnBannerWithLocalStorage', () => {
    it('renders the banner with title and CTA', () => {
      const mockOnHnSignupClick = jest.fn()
      render(<HnBannerWithLocalStorage onHnSignupClick={mockOnHnSignupClick} />)

      expect(screen.getByText('Strengthen your Safe')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Learn more' })).toBeInTheDocument()
    })

    it('renders dismiss button', () => {
      const mockOnHnSignupClick = jest.fn()
      render(<HnBannerWithLocalStorage onHnSignupClick={mockOnHnSignupClick} />)

      const dismissButton = screen.getByRole('button', { name: 'close' })
      expect(dismissButton).toBeInTheDocument()
    })

    it('sets localStorage to false when dismissed', async () => {
      const user = (await import('@testing-library/user-event')).default
      const mockOnHnSignupClick = jest.fn()
      render(<HnBannerWithLocalStorage onHnSignupClick={mockOnHnSignupClick} />)

      const dismissButton = screen.getByRole('button', { name: 'close' })
      await user.click(dismissButton)

      expect(local.getItem(HN_BANNER_LS_KEY)).toBe(false)
    })

    it('calls onHnSignupClick when CTA is clicked', async () => {
      const user = (await import('@testing-library/user-event')).default
      const mockOnHnSignupClick = jest.fn()
      render(<HnBannerWithLocalStorage onHnSignupClick={mockOnHnSignupClick} />)

      const ctaButton = screen.getByRole('button', { name: 'Learn more' })
      await user.click(ctaButton)

      expect(mockOnHnSignupClick).toHaveBeenCalledTimes(1)
    })
  })

  describe('HnBannerWithLocalStorageVisibility', () => {
    const mockSetBannerVisible = jest.fn()

    beforeEach(() => {
      jest.clearAllMocks()
      jest.spyOn(useIsHypernativeFeatureHook, 'useIsHypernativeFeature').mockReturnValue(true)
      // Clear localStorage before each test
      local.removeItem(HN_BANNER_LS_KEY)
      // Mock useLocalStorage to return undefined by default (banner should show)
      jest.spyOn(useLocalStorageHook, 'default').mockReturnValue([undefined, mockSetBannerVisible])
    })

    it('renders banner when localStorage value is undefined', () => {
      // Mock useLocalStorage to return undefined (banner should show)
      jest.spyOn(useLocalStorageHook, 'default').mockReturnValue([undefined, mockSetBannerVisible])

      render(<HnBannerWithLocalStorageVisibility />)

      expect(screen.getByText('Strengthen your Safe')).toBeInTheDocument()
    })

    it('renders banner when localStorage value is true', () => {
      // Mock useLocalStorage to return true (banner should show)
      jest.spyOn(useLocalStorageHook, 'default').mockReturnValue([true, mockSetBannerVisible])

      render(<HnBannerWithLocalStorageVisibility />)

      expect(screen.getByText('Strengthen your Safe')).toBeInTheDocument()
    })

    it('does not render banner when localStorage value is false', () => {
      // Mock useLocalStorage to return false (banner should not show)
      jest.spyOn(useLocalStorageHook, 'default').mockReturnValue([false, mockSetBannerVisible])

      const { container } = render(<HnBannerWithLocalStorageVisibility />)

      expect(container.firstChild).toBeNull()
      expect(screen.queryByText('Strengthen your Safe')).not.toBeInTheDocument()
    })

    it('does not render banner when feature is not enabled', () => {
      jest.spyOn(useIsHypernativeFeatureHook, 'useIsHypernativeFeature').mockReturnValue(false)
      const { container } = render(<HnBannerWithLocalStorageVisibility />)

      expect(container.firstChild).toBeNull()
      expect(screen.queryByText('Strengthen your Safe')).not.toBeInTheDocument()
    })

    it('hides banner after dismissal and persists in localStorage', async () => {
      const user = (await import('@testing-library/user-event')).default
      jest.spyOn(useIsHypernativeFeatureHook, 'useIsHypernativeFeature').mockReturnValue(true)

      // Start with undefined (banner visible)
      jest.spyOn(useLocalStorageHook, 'default').mockReturnValue([undefined, mockSetBannerVisible])

      const { rerender } = render(<HnBannerWithLocalStorageVisibility />)

      expect(screen.getByText('Strengthen your Safe')).toBeInTheDocument()

      const dismissButton = screen.getByRole('button', { name: 'close' })
      await user.click(dismissButton)

      // Verify setBannerVisible was called with false
      expect(mockSetBannerVisible).toHaveBeenCalledWith(false)

      // Mock useLocalStorage to return false after dismissal
      jest.spyOn(useLocalStorageHook, 'default').mockReturnValue([false, mockSetBannerVisible])

      // Rerender to simulate component re-render
      rerender(<HnBannerWithLocalStorageVisibility />)

      // Banner should not be visible after dismissal
      expect(screen.queryByText('Strengthen your Safe')).not.toBeInTheDocument()
    })
  })
})
