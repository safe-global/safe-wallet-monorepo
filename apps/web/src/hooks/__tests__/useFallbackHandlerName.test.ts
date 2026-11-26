import { renderHook } from '@/tests/test-utils'
import { faker } from '@faker-js/faker'
import {
  getCompatibilityFallbackHandlerDeployment,
  getExtensibleFallbackHandlerDeployment,
  getTokenCallbackHandlerDeployment,
} from '@safe-global/safe-deployments'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useTWAPFallbackHandlerAddress } from '@/features/swap/public/hooks/useIsTWAPFallbackHandler'
import { safeInfoBuilder } from '@/tests/builders/safe'
import { TWAP_FALLBACK_HANDLER } from '@/features/swap/public/utils'
import { useFallbackHandlerName } from '../useFallbackHandlerName'

jest.mock('@/hooks/useSafeInfo')
jest.mock('@/features/swap/public/hooks/useIsTWAPFallbackHandler', () => ({
  ...jest.requireActual('@/features/swap/public/hooks/useIsTWAPFallbackHandler'),
  useTWAPFallbackHandlerAddress: jest.fn(),
}))

const mockFallbackHandler = (address: string) => {
  ;(useSafeInfo as jest.Mock).mockReturnValue({
    safe: safeInfoBuilder()
      .with({ chainId: '1', fallbackHandler: { value: address } })
      .build(),
  })
}

describe('useFallbackHandlerName', () => {
  beforeEach(() => {
    ;(useTWAPFallbackHandlerAddress as jest.Mock).mockReturnValue(TWAP_FALLBACK_HANDLER)
  })

  it('names the CompatibilityFallbackHandler', () => {
    mockFallbackHandler(getCompatibilityFallbackHandlerDeployment({ network: '1', version: '1.4.1' })!.defaultAddress)

    const { result } = renderHook(() => useFallbackHandlerName())

    expect(result.current).toBe('CompatibilityFallbackHandler')
  })

  it('names the ExtensibleFallbackHandler', () => {
    mockFallbackHandler(getExtensibleFallbackHandlerDeployment({ network: '1', version: '1.5.0' })!.defaultAddress)

    const { result } = renderHook(() => useFallbackHandlerName())

    expect(result.current).toBe('ExtensibleFallbackHandler')
  })

  it('names the TokenCallbackHandler', () => {
    mockFallbackHandler(getTokenCallbackHandlerDeployment({ network: '1', version: '1.5.0' })!.defaultAddress)

    const { result } = renderHook(() => useFallbackHandlerName())

    expect(result.current).toBe('TokenCallbackHandler')
  })

  it('returns undefined for an unknown handler', () => {
    mockFallbackHandler(faker.finance.ethereumAddress())

    const { result } = renderHook(() => useFallbackHandlerName())

    expect(result.current).toBeUndefined()
  })
})
