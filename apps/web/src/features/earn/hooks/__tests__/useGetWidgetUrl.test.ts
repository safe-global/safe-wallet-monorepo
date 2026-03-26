import { renderHook } from '@testing-library/react'
import useGetWidgetUrl from '../useGetWidgetUrl'
import { WIDGET_TESTNET_URL, WIDGET_PRODUCTION_URL } from '../../constants'

const mockUseDarkMode = jest.fn()
const mockUseChainId = jest.fn()
const mockUseChains = jest.fn()

jest.mock('@/hooks/useDarkMode', () => ({
  useDarkMode: () => mockUseDarkMode(),
}))

jest.mock('@/hooks/useChainId', () => ({
  __esModule: true,
  default: () => mockUseChainId(),
}))

jest.mock('@/hooks/useChains', () => ({
  __esModule: true,
  default: () => mockUseChains(),
}))

describe('useGetWidgetUrl', () => {
  beforeEach(() => {
    mockUseDarkMode.mockReturnValue(false)
    mockUseChainId.mockReturnValue('1')
    mockUseChains.mockReturnValue({
      configs: [
        { chainId: '1', isTestnet: false },
        { chainId: '5', isTestnet: true },
      ],
    })
  })

  afterEach(() => jest.clearAllMocks())

  it('returns production URL for mainnet', () => {
    const { result } = renderHook(() => useGetWidgetUrl())

    expect(result.current).toContain(WIDGET_PRODUCTION_URL)
  })

  it('returns testnet URL for test chains', () => {
    mockUseChainId.mockReturnValue('5')

    const { result } = renderHook(() => useGetWidgetUrl())

    expect(result.current).toContain(WIDGET_TESTNET_URL)
  })

  it('includes light theme param by default', () => {
    const { result } = renderHook(() => useGetWidgetUrl())

    expect(result.current).toContain('theme=light')
  })

  it('includes dark theme param when dark mode is active', () => {
    mockUseDarkMode.mockReturnValue(true)

    const { result } = renderHook(() => useGetWidgetUrl())

    expect(result.current).toContain('theme=dark')
  })

  it('includes asset_id param when asset is provided', () => {
    const { result } = renderHook(() => useGetWidgetUrl('0xtoken'))

    expect(result.current).toContain('asset_id=0xtoken')
  })

  it('does not include asset_id param when no asset', () => {
    const { result } = renderHook(() => useGetWidgetUrl())

    expect(result.current).not.toContain('asset_id')
  })
})
