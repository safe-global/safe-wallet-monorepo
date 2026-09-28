import { renderHook } from '@/tests/test-utils'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { useHasFeature } from '@/hooks/useChains'
import { useIsSafeProEnabled } from '@/hooks/useIsSafeProEnabled'
import { useIsSafeProPlansV2Enabled } from '../useIsSafeProPlansV2Enabled'

jest.mock('@/hooks/useChains')
jest.mock('@/hooks/useIsSafeProEnabled')

const mockUseHasFeature = useHasFeature as jest.MockedFunction<typeof useHasFeature>
const mockUseIsSafeProEnabled = useIsSafeProEnabled as jest.MockedFunction<typeof useIsSafeProEnabled>

describe('useIsSafeProPlansV2Enabled', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('reads the SAFE_PRO_PLANS_V2 flag', () => {
    mockUseIsSafeProEnabled.mockReturnValue(true)
    mockUseHasFeature.mockReturnValue(true)

    renderHook(() => useIsSafeProPlansV2Enabled())

    expect(mockUseHasFeature).toHaveBeenCalledWith(FEATURES.SAFE_PRO_PLANS_V2)
  })

  it.each([
    { safePro: true, plansV2: true, expected: true },
    { safePro: true, plansV2: false, expected: false },
    { safePro: true, plansV2: undefined, expected: false },
    { safePro: false, plansV2: true, expected: false },
  ])(
    'returns $expected when SAFE_PRO is $safePro and SAFE_PRO_PLANS_V2 is $plansV2',
    ({ safePro, plansV2, expected }) => {
      mockUseIsSafeProEnabled.mockReturnValue(safePro)
      mockUseHasFeature.mockReturnValue(plansV2)

      const { result } = renderHook(() => useIsSafeProPlansV2Enabled())

      expect(result.current).toBe(expected)
    },
  )
})
