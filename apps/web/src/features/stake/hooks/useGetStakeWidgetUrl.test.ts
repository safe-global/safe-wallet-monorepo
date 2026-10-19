import { renderHook } from '@/tests/test-utils'
import { chainBuilder } from '@/tests/builders/chains'
import { WIDGET_PRODUCTION_URL, WIDGET_TESTNET_URL } from '../constants'
import { useGetStakeWidgetUrl } from './useGetStakeWidgetUrl'

const mockUseDarkMode = jest.fn()
const mockUseChainId = jest.fn()

jest.mock('@/hooks/useDarkMode', () => ({ useDarkMode: () => mockUseDarkMode() }))
jest.mock('@/hooks/useChainId', () => ({ __esModule: true, default: () => mockUseChainId() }))
jest.mock('@/hooks/useChains', () => ({
  __esModule: true,
  default: () => ({
    configs: [
      chainBuilder().with({ chainId: '1', isTestnet: false }).build(),
      chainBuilder().with({ chainId: '11155111', isTestnet: true }).build(),
    ],
  }),
}))

const renderUrl = (asset?: string) => new URL(renderHook(() => useGetStakeWidgetUrl(asset)).result.current)

describe('useGetStakeWidgetUrl', () => {
  beforeEach(() => {
    mockUseDarkMode.mockReturnValue(false)
    mockUseChainId.mockReturnValue('1')
  })

  it.each([
    { chainId: '1', widgetUrl: WIDGET_PRODUCTION_URL },
    { chainId: '11155111', widgetUrl: WIDGET_TESTNET_URL },
    { chainId: '42161', widgetUrl: WIDGET_PRODUCTION_URL },
  ])('opens $widgetUrl on chain $chainId', ({ chainId, widgetUrl }) => {
    mockUseChainId.mockReturnValue(chainId)

    const url = renderUrl()

    expect(`${url.origin}${url.pathname}`).toBe(widgetUrl)
  })

  it.each([
    { darkMode: true, theme: 'dark' },
    { darkMode: false, theme: 'light' },
  ])('passes the $theme theme', ({ darkMode, theme }) => {
    mockUseDarkMode.mockReturnValue(darkMode)

    expect(renderUrl().searchParams.get('theme')).toBe(theme)
  })

  it('preselects the asset when one is given', () => {
    expect(renderUrl('ETH').searchParams.get('asset')).toBe('ETH')
  })

  it('preselects no asset without one', () => {
    expect(renderUrl().searchParams.has('asset')).toBe(false)
  })
})
