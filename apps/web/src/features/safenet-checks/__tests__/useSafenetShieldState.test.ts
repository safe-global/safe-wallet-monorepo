import { faker } from '@faker-js/faker'
import { renderHook } from '@/tests/test-utils'
import { Severity } from '@safe-global/utils/features/safe-shield/types'
import { CheckStatus } from '@safe-global/utils/features/safenet-checks'
import { buildCheckView } from '@safe-global/utils/features/safenet-checks/builders'
import { useFlowSafenetCheck } from '../useFlowSafenetCheck'
import { useSafenetShieldState } from '../useSafenetShieldState'

jest.mock('../useFlowSafenetCheck', () => ({ useFlowSafenetCheck: jest.fn() }))

const readState = (publicStatus: CheckStatus.BENIGN | CheckStatus.MALICIOUS, hasProFeatures = true) => {
  jest.mocked(useFlowSafenetCheck).mockReturnValue({
    safeTxHash: faker.string.hexadecimal({ length: 64, casing: 'lower' }),
    submittedAt: 1,
    check: buildCheckView({ status: publicStatus, publicStatus }),
  })
  return renderHook(() => useSafenetShieldState({ enabled: true, isSafePro: true, hasProFeatures })).result.current
}

describe('useSafenetShieldState', () => {
  it('counts a clean verdict as passed', () => {
    expect(readState(CheckStatus.BENIGN).check).toEqual({ shown: true, passed: true })
  })

  it('counts a risk as not passed and reports it for the header', () => {
    expect(readState(CheckStatus.MALICIOUS)).toEqual({
      check: { shown: true, passed: false },
      risk: { severity: Severity.CRITICAL, title: 'Risk detected' },
    })
  })

  it('counts a locked row as a check that never passes, without reading the chain', () => {
    expect(readState(CheckStatus.BENIGN, false)).toEqual({ check: { shown: true, passed: false }, risk: undefined })
    expect(useFlowSafenetCheck).toHaveBeenLastCalledWith(false)
  })

  it('leaves Safenet out of the count when the feature flag is off', () => {
    readState(CheckStatus.MALICIOUS)
    const { result } = renderHook(() =>
      useSafenetShieldState({ enabled: false, isSafePro: true, hasProFeatures: true }),
    )

    expect(result.current).toEqual({ check: { shown: false, passed: false }, risk: undefined })
    expect(useFlowSafenetCheck).toHaveBeenLastCalledWith(false)
  })
})
