import { render, screen } from '@/tests/test-utils'
import { HnBanner } from './HnBanner'
import { HnBannerForQueue } from './HnBannerForQueue'
import { HnBannerForHistory } from './HnBannerForHistory'
import { BannerType } from '../../hooks/useBannerStorage'
import * as useIsHypernativeFeatureHook from '../../hooks/useIsHypernativeFeature'
import * as useBannerVisibilityHook from '../../hooks/useBannerVisibility'

// Mock HnSignupFlow to avoid rendering the actual modal in tests
jest.mock('../HnSignupFlow', () => ({
  HnSignupFlow: ({ open }: { open: boolean }) => (open ? <div data-testid="hn-signup-flow" /> : null),
}))

describe('HnBanner', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('HnBanner', () => {
    it('renders title and CTA', () => {
      const mockOnHnSignupClick = jest.fn()
      render(<HnBanner onHnSignupClick={mockOnHnSignupClick} />)

      expect(screen.getByText('Enforce enterprise-grade security')).toBeInTheDocument()
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

  describe('HnBannerForQueue', () => {
    beforeEach(() => {
      jest.clearAllMocks()
    })

    describe('when feature is not enabled', () => {
      it('should not render banner', () => {
        jest.spyOn(useIsHypernativeFeatureHook, 'useIsHypernativeFeature').mockReturnValue(false)
        jest.spyOn(useBannerVisibilityHook, 'useBannerVisibility').mockReturnValue({
          showBanner: true,
          loading: false,
        })

        const { container } = render(<HnBannerForQueue />)

        expect(container.firstChild).toBeNull()
        expect(screen.queryByText('Enforce enterprise-grade security')).not.toBeInTheDocument()
      })
    })

    describe('when feature is enabled but banner should not show', () => {
      it('should not render banner when showBanner is false', () => {
        jest.spyOn(useIsHypernativeFeatureHook, 'useIsHypernativeFeature').mockReturnValue(true)
        jest.spyOn(useBannerVisibilityHook, 'useBannerVisibility').mockReturnValue({
          showBanner: false,
          loading: false,
        })

        const { container } = render(<HnBannerForQueue />)

        expect(container.firstChild).toBeNull()
        expect(screen.queryByText('Enforce enterprise-grade security')).not.toBeInTheDocument()
      })

      it('should not render banner when loading is true', () => {
        jest.spyOn(useIsHypernativeFeatureHook, 'useIsHypernativeFeature').mockReturnValue(true)
        jest.spyOn(useBannerVisibilityHook, 'useBannerVisibility').mockReturnValue({
          showBanner: true,
          loading: true,
        })

        const { container } = render(<HnBannerForQueue />)

        expect(container.firstChild).toBeNull()
        expect(screen.queryByText('Enforce enterprise-grade security')).not.toBeInTheDocument()
      })
    })

    describe('when feature is enabled and banner should show', () => {
      it('should render banner with Queue label when all conditions are met', () => {
        jest.spyOn(useIsHypernativeFeatureHook, 'useIsHypernativeFeature').mockReturnValue(true)
        jest.spyOn(useBannerVisibilityHook, 'useBannerVisibility').mockReturnValue({
          showBanner: true,
          loading: false,
        })

        render(<HnBannerForQueue />)

        expect(screen.getByText('Enforce enterprise-grade security')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Learn more' })).toBeInTheDocument()
        expect(useBannerVisibilityHook.useBannerVisibility).toHaveBeenCalledWith(BannerType.Promo)
      })

      it('should render dismiss button', () => {
        jest.spyOn(useIsHypernativeFeatureHook, 'useIsHypernativeFeature').mockReturnValue(true)
        jest.spyOn(useBannerVisibilityHook, 'useBannerVisibility').mockReturnValue({
          showBanner: true,
          loading: false,
        })

        render(<HnBannerForQueue />)

        const dismissButton = screen.getByRole('button', { name: 'close' })
        expect(dismissButton).toBeInTheDocument()
      })
    })
  })

  describe('HnBannerForHistory', () => {
    beforeEach(() => {
      jest.clearAllMocks()
    })

    describe('when feature is not enabled', () => {
      it('should not render banner', () => {
        jest.spyOn(useIsHypernativeFeatureHook, 'useIsHypernativeFeature').mockReturnValue(false)
        jest.spyOn(useBannerVisibilityHook, 'useBannerVisibility').mockReturnValue({
          showBanner: true,
          loading: false,
        })

        const { container } = render(<HnBannerForHistory />)

        expect(container.firstChild).toBeNull()
        expect(screen.queryByText('Enforce enterprise-grade security')).not.toBeInTheDocument()
      })
    })

    describe('when feature is enabled but banner should not show', () => {
      it('should not render banner when showBanner is false', () => {
        jest.spyOn(useIsHypernativeFeatureHook, 'useIsHypernativeFeature').mockReturnValue(true)
        jest.spyOn(useBannerVisibilityHook, 'useBannerVisibility').mockReturnValue({
          showBanner: false,
          loading: false,
        })

        const { container } = render(<HnBannerForHistory />)

        expect(container.firstChild).toBeNull()
        expect(screen.queryByText('Enforce enterprise-grade security')).not.toBeInTheDocument()
      })

      it('should not render banner when loading is true', () => {
        jest.spyOn(useIsHypernativeFeatureHook, 'useIsHypernativeFeature').mockReturnValue(true)
        jest.spyOn(useBannerVisibilityHook, 'useBannerVisibility').mockReturnValue({
          showBanner: true,
          loading: true,
        })

        const { container } = render(<HnBannerForHistory />)

        expect(container.firstChild).toBeNull()
        expect(screen.queryByText('Enforce enterprise-grade security')).not.toBeInTheDocument()
      })
    })

    describe('when feature is enabled and banner should show', () => {
      it('should render banner with History label when all conditions are met', () => {
        jest.spyOn(useIsHypernativeFeatureHook, 'useIsHypernativeFeature').mockReturnValue(true)
        jest.spyOn(useBannerVisibilityHook, 'useBannerVisibility').mockReturnValue({
          showBanner: true,
          loading: false,
        })

        render(<HnBannerForHistory />)

        expect(screen.getByText('Enforce enterprise-grade security')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Learn more' })).toBeInTheDocument()
        expect(useBannerVisibilityHook.useBannerVisibility).toHaveBeenCalledWith(BannerType.Promo)
      })

      it('should render dismiss button', () => {
        jest.spyOn(useIsHypernativeFeatureHook, 'useIsHypernativeFeature').mockReturnValue(true)
        jest.spyOn(useBannerVisibilityHook, 'useBannerVisibility').mockReturnValue({
          showBanner: true,
          loading: false,
        })

        render(<HnBannerForHistory />)

        const dismissButton = screen.getByRole('button', { name: 'close' })
        expect(dismissButton).toBeInTheDocument()
      })
    })
  })
})
