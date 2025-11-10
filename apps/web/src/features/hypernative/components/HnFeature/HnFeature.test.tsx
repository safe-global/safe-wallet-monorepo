import { render, screen } from '@/tests/test-utils'
import HnFeature from './HnFeature'
import { BannerType } from '../../hooks/useBannerStorage'
import * as useIsHypernativeFeatureHook from '../../hooks/useIsHypernativeFeature'
import * as useBannerVisibilityHook from '../../hooks/useBannerVisibility'

describe('HnFeature', () => {
  const TestChild = () => <div>Test Content</div>

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('when feature is not enabled', () => {
    it('should not render children', () => {
      jest.spyOn(useIsHypernativeFeatureHook, 'useIsHypernativeFeature').mockReturnValue(false)
      jest.spyOn(useBannerVisibilityHook, 'useBannerVisibility').mockReturnValue({
        showBanner: true,
        loading: false,
      })

      const { container } = render(
        <HnFeature bannerType={BannerType.Promo}>
          <TestChild />
        </HnFeature>,
      )

      expect(container.firstChild).toBeNull()
      expect(screen.queryByText('Test Content')).not.toBeInTheDocument()
    })
  })

  describe('when feature is enabled but banner should not show', () => {
    it('should not render children when showBanner is false', () => {
      jest.spyOn(useIsHypernativeFeatureHook, 'useIsHypernativeFeature').mockReturnValue(true)
      jest.spyOn(useBannerVisibilityHook, 'useBannerVisibility').mockReturnValue({
        showBanner: false,
        loading: false,
      })

      const { container } = render(
        <HnFeature bannerType={BannerType.Promo}>
          <TestChild />
        </HnFeature>,
      )

      expect(container.firstChild).toBeNull()
      expect(screen.queryByText('Test Content')).not.toBeInTheDocument()
    })

    it('should not render children when loading is true', () => {
      jest.spyOn(useIsHypernativeFeatureHook, 'useIsHypernativeFeature').mockReturnValue(true)
      jest.spyOn(useBannerVisibilityHook, 'useBannerVisibility').mockReturnValue({
        showBanner: true,
        loading: true,
      })

      const { container } = render(
        <HnFeature bannerType={BannerType.Promo}>
          <TestChild />
        </HnFeature>,
      )

      expect(container.firstChild).toBeNull()
      expect(screen.queryByText('Test Content')).not.toBeInTheDocument()
    })
  })

  describe('when feature is enabled and banner should show', () => {
    it('should render children when all conditions are met', () => {
      jest.spyOn(useIsHypernativeFeatureHook, 'useIsHypernativeFeature').mockReturnValue(true)
      jest.spyOn(useBannerVisibilityHook, 'useBannerVisibility').mockReturnValue({
        showBanner: true,
        loading: false,
      })

      render(
        <HnFeature bannerType={BannerType.Promo}>
          <TestChild />
        </HnFeature>,
      )

      expect(screen.getByText('Test Content')).toBeInTheDocument()
    })

    it('should work with BannerType.Pending', () => {
      jest.spyOn(useIsHypernativeFeatureHook, 'useIsHypernativeFeature').mockReturnValue(true)
      jest.spyOn(useBannerVisibilityHook, 'useBannerVisibility').mockReturnValue({
        showBanner: true,
        loading: false,
      })

      render(
        <HnFeature bannerType={BannerType.Pending}>
          <TestChild />
        </HnFeature>,
      )

      expect(screen.getByText('Test Content')).toBeInTheDocument()
      expect(useBannerVisibilityHook.useBannerVisibility).toHaveBeenCalledWith(BannerType.Pending)
    })

    it('should work with BannerType.Promo', () => {
      jest.spyOn(useIsHypernativeFeatureHook, 'useIsHypernativeFeature').mockReturnValue(true)
      jest.spyOn(useBannerVisibilityHook, 'useBannerVisibility').mockReturnValue({
        showBanner: true,
        loading: false,
      })

      render(
        <HnFeature bannerType={BannerType.Promo}>
          <TestChild />
        </HnFeature>,
      )

      expect(screen.getByText('Test Content')).toBeInTheDocument()
      expect(useBannerVisibilityHook.useBannerVisibility).toHaveBeenCalledWith(BannerType.Promo)
    })
  })
})

