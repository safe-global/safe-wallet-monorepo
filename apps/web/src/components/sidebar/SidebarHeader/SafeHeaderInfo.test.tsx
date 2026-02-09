import { render } from '@/tests/test-utils'
import SafeHeaderInfo from './SafeHeaderInfo'
import * as useSafeInfo from '@/hooks/useSafeInfo'
import * as useSafeAddress from '@/hooks/useSafeAddress'
import * as useAddressResolver from '@/hooks/useAddressResolver'
import * as useVisibleBalances from '@/hooks/useVisibleBalances'
import * as useIsHypernativeGuard from '@/features/hypernative/hooks/useIsHypernativeGuard'
import * as coreFeatures from '@/features/__core__'
import { SafeHeaderHnTooltip } from '@/features/hypernative/components/SafeHeaderHnTooltip'
import { extendedSafeInfoBuilder } from '@/tests/builders/safe'

const MOCK_SAFE_ADDRESS = '0x0000000000000000000000000000000000005AFE'

jest.mock('@/hooks/useSafeInfo')
jest.mock('@/hooks/useSafeAddress')
jest.mock('@/hooks/useAddressResolver')
jest.mock('@/hooks/useVisibleBalances')
jest.mock('@/features/hypernative/hooks/useIsHypernativeGuard')
jest.mock('@/features/__core__', () => ({
  ...jest.requireActual('@/features/__core__'),
  useLoadFeature: jest.fn(),
}))

const mockUseLoadFeature = coreFeatures.useLoadFeature as jest.Mock

describe('SafeHeaderInfo', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    const mockSafe = extendedSafeInfoBuilder().build()

    jest.spyOn(useSafeInfo, 'default').mockReturnValue({
      safe: mockSafe,
      safeAddress: MOCK_SAFE_ADDRESS,
      safeLoaded: true,
      safeLoading: false,
      safeError: undefined,
    })

    jest.spyOn(useSafeAddress, 'default').mockReturnValue(MOCK_SAFE_ADDRESS)

    jest.spyOn(useAddressResolver, 'useAddressResolver').mockReturnValue({
      ens: 'test.eth',
      name: undefined,
      resolving: false,
    })

    jest.spyOn(useVisibleBalances, 'useVisibleBalances').mockReturnValue({
      balances: {
        items: [],
        fiatTotal: '1000',
        isAllTokensMode: false,
      },
      loaded: true,
      loading: false,
      error: undefined,
    })

    jest.spyOn(useIsHypernativeGuard, 'useIsHypernativeGuard').mockReturnValue({
      isHypernativeGuard: false,
      loading: false,
    })

    mockUseLoadFeature.mockReturnValue({
      SafeHeaderHnTooltip,
      $isLoading: false,
      $isDisabled: false,
      $isReady: true,
    })
  })

  describe('Safe Shield icon', () => {
    it('renders shield icon when isHypernativeGuard is true and name is not undefined', () => {
      jest.spyOn(useIsHypernativeGuard, 'useIsHypernativeGuard').mockReturnValue({
        isHypernativeGuard: true,
        loading: false,
      })

      jest.spyOn(useAddressResolver, 'useAddressResolver').mockReturnValue({
        ens: 'My Safe Account',
        name: undefined,
        resolving: false,
      })

      const { container } = render(<SafeHeaderInfo />)

      // Check that the shield icon is rendered
      // The HypernativeTooltip wraps the SvgIcon in a span with display: flex
      const tooltipSpans = Array.from(container.querySelectorAll('span')).filter((span) => {
        const styles = window.getComputedStyle(span)
        return styles.display === 'flex' && span.querySelector('[class*="MuiSvgIcon"]') !== null
      })

      // Should have at least one span with flex display containing the shield icon
      expect(tooltipSpans.length).toBeGreaterThan(0)
    })

    it('renders shield icon when isHypernativeGuard is true and name is undefined', () => {
      jest.spyOn(useIsHypernativeGuard, 'useIsHypernativeGuard').mockReturnValue({
        isHypernativeGuard: true,
        loading: false,
      })

      jest.spyOn(useAddressResolver, 'useAddressResolver').mockReturnValue({
        ens: undefined,
        name: undefined,
        resolving: false,
      })

      const { container } = render(<SafeHeaderInfo />)

      const tooltipSpans = Array.from(container.querySelectorAll('span')).filter((span) => {
        const styles = window.getComputedStyle(span)
        return styles.display === 'flex' && span.querySelector('[class*="MuiSvgIcon"]') !== null
      })

      // Should have at least one span with flex display containing the shield icon
      expect(tooltipSpans.length).toBeGreaterThan(0)
    })

    it('does not render shield icon when isHypernativeGuard is false', () => {
      jest.spyOn(useIsHypernativeGuard, 'useIsHypernativeGuard').mockReturnValue({
        isHypernativeGuard: false,
        loading: false,
      })

      jest.spyOn(useAddressResolver, 'useAddressResolver').mockReturnValue({
        ens: undefined,
        name: undefined,
        resolving: false,
      })

      const { container } = render(<SafeHeaderInfo />)

      // When isHypernativeGuard is false, the shield icon should not be rendered
      const tooltipSpans = Array.from(container.querySelectorAll('span')).filter((span) => {
        const styles = window.getComputedStyle(span)
        const hasSvgIcon = span.querySelector('[class*="MuiSvgIcon"]') !== null
        return styles.display === 'flex' && hasSvgIcon
      })

      expect(tooltipSpans.length).toBe(0)
    })
  })
})
