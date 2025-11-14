import { renderHook } from '@/tests/test-utils'
import { faker } from '@faker-js/faker'
import useMixpanel from '../useMixpanel'
import * as mixpanelModule from '../mixpanel'
import * as useHasFeatureHook from '@/hooks/useChains'
import * as useSafeAddressHook from '@/hooks/useSafeAddress'
import * as useWalletHook from '@/hooks/wallets/useWallet'
import * as useIsSpaceRouteHook from '@/hooks/useIsSpaceRoute'
import * as useMixpanelUserPropertiesHook from '../useMixpanelUserProperties'
import * as useChainHook from '@/hooks/useChains'
import * as useSafeInfoHook from '@/hooks/useSafeInfo'
import { CookieAndTermType, cookiesAndTermsSlice, cookiesAndTermsInitialState } from '@/store/cookiesAndTermsSlice'
import { DeviceType } from '../types'
import { MixpanelUserProperty } from '../mixpanel-events'
import mixpanel from 'mixpanel-browser'
import { version } from '@/markdown/terms/version'
import type { RootState } from '@/store'

// Mock mixpanel-browser
jest.mock('mixpanel-browser', () => ({
  init: jest.fn(),
  register: jest.fn(),
  opt_in_tracking: jest.fn(),
  opt_out_tracking: jest.fn(),
  identify: jest.fn(),
  people: {
    set: jest.fn(),
  },
  track: jest.fn(),
}))

// Mock MUI hooks
jest.mock('@mui/material/styles', () => {
  const original = jest.requireActual('@mui/material/styles')
  return {
    ...original,
    useTheme: jest.fn(() => ({
      breakpoints: {
        down: jest.fn((breakpoint) => breakpoint === 'sm' || breakpoint === 'md'),
      },
    })),
  }
})

jest.mock('@mui/material', () => {
  const original = jest.requireActual('@mui/material')
  return {
    ...original,
    useMediaQuery: jest.fn(() => false), // Default to desktop (not mobile, not tablet)
  }
})

// Mock hooks
jest.mock('@/hooks/useChains', () => ({
  useHasFeature: jest.fn(),
  useChain: jest.fn(),
}))

jest.mock('@/hooks/useSafeAddress', () => ({
  __esModule: true,
  default: jest.fn(),
}))

jest.mock('@/hooks/wallets/useWallet', () => ({
  __esModule: true,
  default: jest.fn(),
}))

jest.mock('@/hooks/useIsSpaceRoute', () => ({
  useIsSpaceRoute: jest.fn(),
}))

jest.mock('../useMixpanelUserProperties', () => ({
  useMixpanelUserProperties: jest.fn(),
}))

jest.mock('@/hooks/useSafeInfo', () => ({
  __esModule: true,
  default: jest.fn(),
}))

describe('useMixpanel', () => {
  const mockSafeAddress = faker.finance.ethereumAddress()
  const mockWalletAddress = faker.finance.ethereumAddress()
  const mockChainName = 'Ethereum'
  const mockChainId = '1'

  beforeEach(() => {
    jest.clearAllMocks()

    // Default mock implementations
    jest.spyOn(useHasFeatureHook, 'useHasFeature').mockReturnValue(true)
    jest.spyOn(useSafeAddressHook, 'default').mockReturnValue(mockSafeAddress)
    jest.spyOn(useWalletHook, 'default').mockReturnValue({
      address: mockWalletAddress,
      label: 'Test Wallet',
      chainId: mockChainId,
    } as any)
    jest.spyOn(useIsSpaceRouteHook, 'useIsSpaceRoute').mockReturnValue(false)
    jest.spyOn(useMixpanelUserPropertiesHook, 'useMixpanelUserProperties').mockReturnValue({
      properties: {
        [MixpanelUserProperty.SAFE_ADDRESS]: mockSafeAddress,
      },
      networks: [mockChainName],
    })
    jest.spyOn(useSafeInfoHook, 'default').mockReturnValue({
      safe: {
        chainId: mockChainId,
      },
    } as any)
    jest.spyOn(useChainHook, 'useChain').mockReturnValue({
      chainName: mockChainName,
      chainId: mockChainId,
    } as any)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should initialize mixpanel when feature is enabled', () => {
    jest.spyOn(mixpanelModule, 'mixpanelInit')
    const initialReduxState: Partial<RootState> = {
      [cookiesAndTermsSlice.name]: {
        ...cookiesAndTermsInitialState,
        [CookieAndTermType.ANALYTICS]: true,
        termsVersion: version,
      },
    }

    renderHook(() => useMixpanel(), { initialReduxState })

    expect(mixpanelModule.mixpanelInit).toHaveBeenCalledTimes(1)
  })

  it('should not initialize mixpanel when feature is disabled', () => {
    jest.spyOn(useHasFeatureHook, 'useHasFeature').mockReturnValue(false)
    jest.spyOn(mixpanelModule, 'mixpanelInit')
    const initialReduxState: Partial<RootState> = {
      [cookiesAndTermsSlice.name]: {
        ...cookiesAndTermsInitialState,
        [CookieAndTermType.ANALYTICS]: true,
        termsVersion: version,
      },
    }

    renderHook(() => useMixpanel(), { initialReduxState })

    expect(mixpanelModule.mixpanelInit).not.toHaveBeenCalled()
  })

  it('should opt in tracking when analytics is enabled', () => {
    const initialReduxState: Partial<RootState> = {
      [cookiesAndTermsSlice.name]: {
        ...cookiesAndTermsInitialState,
        [CookieAndTermType.ANALYTICS]: true,
        termsVersion: version,
      },
    }

    renderHook(() => useMixpanel(), { initialReduxState })

    expect(mixpanel.opt_in_tracking).toHaveBeenCalled()
  })

  it('should opt out tracking when analytics is disabled', () => {
    const initialReduxState: Partial<RootState> = {
      [cookiesAndTermsSlice.name]: {
        ...cookiesAndTermsInitialState,
        [CookieAndTermType.ANALYTICS]: false,
        termsVersion: version,
      },
    }

    renderHook(() => useMixpanel(), { initialReduxState })

    expect(mixpanel.opt_out_tracking).toHaveBeenCalled()
  })

  const getDefaultInitialReduxState = (): Partial<RootState> => ({
    [cookiesAndTermsSlice.name]: {
      ...cookiesAndTermsInitialState,
      [CookieAndTermType.ANALYTICS]: true,
      termsVersion: version,
    },
  })

  it('should set blockchain network when chain is available', () => {
    jest.spyOn(mixpanelModule, 'mixpanelSetBlockchainNetwork')

    renderHook(() => useMixpanel(), { initialReduxState: getDefaultInitialReduxState() })

    expect(mixpanelModule.mixpanelSetBlockchainNetwork).toHaveBeenCalledWith(mockChainName)
  })

  it('should set device type', () => {
    jest.spyOn(mixpanelModule, 'mixpanelSetDeviceType')

    renderHook(() => useMixpanel(), { initialReduxState: getDefaultInitialReduxState() })

    expect(mixpanelModule.mixpanelSetDeviceType).toHaveBeenCalledWith(DeviceType.DESKTOP)
  })

  it('should set safe address', () => {
    jest.spyOn(mixpanelModule, 'mixpanelSetSafeAddress')

    renderHook(() => useMixpanel(), { initialReduxState: getDefaultInitialReduxState() })

    expect(mixpanelModule.mixpanelSetSafeAddress).toHaveBeenCalledWith(mockSafeAddress)
  })

  it('should identify user when safe address exists and not on space route', () => {
    jest.spyOn(mixpanelModule, 'mixpanelIdentify')

    renderHook(() => useMixpanel(), { initialReduxState: getDefaultInitialReduxState() })

    expect(mixpanelModule.mixpanelIdentify).toHaveBeenCalledWith(mockSafeAddress)
  })

  it('should not identify user when on space route', () => {
    jest.spyOn(useIsSpaceRouteHook, 'useIsSpaceRoute').mockReturnValue(true)
    jest.spyOn(mixpanelModule, 'mixpanelIdentify')

    renderHook(() => useMixpanel(), { initialReduxState: getDefaultInitialReduxState() })

    expect(mixpanelModule.mixpanelIdentify).not.toHaveBeenCalled()
  })

  it('should set wallet properties when wallet is connected', () => {
    jest.spyOn(mixpanelModule, 'mixpanelSetUserProperties')
    jest.spyOn(mixpanelModule, 'mixpanelSetEOAWalletLabel')
    jest.spyOn(mixpanelModule, 'mixpanelSetEOAWalletAddress')
    jest.spyOn(mixpanelModule, 'mixpanelSetEOAWalletNetwork')

    renderHook(() => useMixpanel(), { initialReduxState: getDefaultInitialReduxState() })

    expect(mixpanelModule.mixpanelSetUserProperties).toHaveBeenCalledWith({
      [MixpanelUserProperty.WALLET_LABEL]: 'Test Wallet',
      [MixpanelUserProperty.WALLET_ADDRESS]: mockWalletAddress,
    })
    expect(mixpanelModule.mixpanelSetEOAWalletLabel).toHaveBeenCalledWith('Test Wallet')
    expect(mixpanelModule.mixpanelSetEOAWalletAddress).toHaveBeenCalledWith(mockWalletAddress)
    expect(mixpanelModule.mixpanelSetEOAWalletNetwork).toHaveBeenCalledWith(mockChainName)
  })

  it('should clear wallet properties when wallet is not connected', () => {
    jest.spyOn(useWalletHook, 'default').mockReturnValue(null)
    jest.spyOn(mixpanelModule, 'mixpanelSetEOAWalletLabel')
    jest.spyOn(mixpanelModule, 'mixpanelSetEOAWalletAddress')
    jest.spyOn(mixpanelModule, 'mixpanelSetEOAWalletNetwork')

    renderHook(() => useMixpanel(), { initialReduxState: getDefaultInitialReduxState() })

    expect(mixpanelModule.mixpanelSetEOAWalletLabel).toHaveBeenCalledWith('')
    expect(mixpanelModule.mixpanelSetEOAWalletAddress).toHaveBeenCalledWith('')
    expect(mixpanelModule.mixpanelSetEOAWalletNetwork).toHaveBeenCalledWith('')
  })

  it('should set user properties from useMixpanelUserProperties', () => {
    const mockUserProperties = {
      properties: {
        [MixpanelUserProperty.SAFE_ADDRESS]: mockSafeAddress,
        [MixpanelUserProperty.SAFE_VERSION]: '1.3.0',
      },
      networks: [mockChainName],
    }
    jest.spyOn(useMixpanelUserPropertiesHook, 'useMixpanelUserProperties').mockReturnValue(mockUserProperties)
    jest.spyOn(mixpanelModule, 'mixpanelSetUserProperties')

    renderHook(() => useMixpanel(), { initialReduxState: getDefaultInitialReduxState() })

    expect(mixpanelModule.mixpanelSetUserProperties).toHaveBeenCalledWith(mockUserProperties.properties)
  })

  it('should not set user properties when useMixpanelUserProperties returns null', () => {
    jest.spyOn(useMixpanelUserPropertiesHook, 'useMixpanelUserProperties').mockReturnValue(null)
    jest.spyOn(mixpanelModule, 'mixpanelSetUserProperties')

    renderHook(() => useMixpanel(), { initialReduxState: getDefaultInitialReduxState() })

    // Should only be called for wallet properties, not user properties
    expect(mixpanelModule.mixpanelSetUserProperties).toHaveBeenCalledTimes(1)
  })
})
