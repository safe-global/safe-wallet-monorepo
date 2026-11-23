import { renderHook } from '@/tests/test-utils'
import { useEnabledWizardSteps } from '../hooks/useEnabledWizardSteps'

let mockSafeProFlag: boolean | undefined
let mockSurveyFlag: boolean | undefined
jest.mock('@/hooks/useIsSafeProEnabled', () => ({
  useIsSafeProEnabled: () => mockSafeProFlag === true,
  useSafeProFlag: () => mockSafeProFlag,
}))
jest.mock('@/hooks/useIsSurveyEnabled', () => ({ __esModule: true, default: () => mockSurveyFlag }))

const stepIds = () => renderHook(() => useEnabledWizardSteps()).result.current?.map((step) => step.id)

describe('useEnabledWizardSteps', () => {
  it.each([
    ['Safe Pro', undefined, false],
    ['the survey', true, undefined],
  ])('knows no steps while the %s flag loads', (_, safePro, survey) => {
    mockSafeProFlag = safePro
    mockSurveyFlag = survey

    expect(stepIds()).toBeUndefined()
  })

  it('lists the steps both flags turn on once they are known', () => {
    mockSafeProFlag = true
    mockSurveyFlag = true

    expect(stepIds()).toEqual(['name', 'plan', 'safes', 'invite', 'survey'])
  })

  it('leaves out the plan and survey steps when both flags are off', () => {
    mockSafeProFlag = false
    mockSurveyFlag = false

    expect(stepIds()).toEqual(['name', 'safes', 'invite'])
  })
})
