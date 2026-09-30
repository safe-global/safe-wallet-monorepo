import { renderHook } from '@testing-library/react'
import { useOnboardingStepCount } from '../useOnboardingStepCount'
import useIsSurveyEnabled from '@/hooks/useIsSurveyEnabled'

jest.mock('@/hooks/useIsSurveyEnabled')

const mockedUseIsSurveyEnabled = useIsSurveyEnabled as jest.MockedFunction<typeof useIsSurveyEnabled>

describe('useOnboardingStepCount', () => {
  it('counts 4 steps when the survey is enabled', () => {
    mockedUseIsSurveyEnabled.mockReturnValue(true)

    const { result } = renderHook(() => useOnboardingStepCount())

    expect(result.current).toBe(4)
  })

  it('counts 3 steps when the survey is disabled', () => {
    mockedUseIsSurveyEnabled.mockReturnValue(false)

    const { result } = renderHook(() => useOnboardingStepCount())

    expect(result.current).toBe(3)
  })

  it('counts 3 steps while the chain config is still loading (survey defaults OFF)', () => {
    mockedUseIsSurveyEnabled.mockReturnValue(undefined)

    const { result } = renderHook(() => useOnboardingStepCount())

    expect(result.current).toBe(3)
  })
})
