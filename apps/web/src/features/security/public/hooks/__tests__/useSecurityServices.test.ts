import { renderHook } from '@testing-library/react'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { useHasFeature } from '@/hooks/useChains'
import { securityServices } from '../../services/securityServices'
import { useSecurityServices } from '../useSecurityServices'

jest.mock('@/hooks/useChains')

const mockUseHasFeature = jest.mocked(useHasFeature)

describe('useSecurityServices', () => {
  it('should, when the Security Hub flag is on, return the services', () => {
    mockUseHasFeature.mockReturnValue(true)

    const { result } = renderHook(() => useSecurityServices())

    expect(result.current).toBe(securityServices)
    expect(mockUseHasFeature).toHaveBeenCalledWith(FEATURES.SECURITY_HUB)
  })

  it.each([false, undefined])('should, when the Security Hub flag is %s, return undefined', (flag) => {
    mockUseHasFeature.mockReturnValue(flag)

    const { result } = renderHook(() => useSecurityServices())

    expect(result.current).toBeUndefined()
  })
})
