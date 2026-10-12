import { faker } from '@faker-js/faker'
import { renderHook } from '@/tests/test-utils'
import { Severity } from '@safe-global/utils/features/safe-shield/types'
import { CheckStatus, type PublicCheckStatus } from '@safe-global/utils/features/safenet-checks'
import { buildCheckView } from '@safe-global/utils/features/safenet-checks/builders'
import { useFlowSafenetCheck } from '../useFlowSafenetCheck'
import { useSafenetShieldState } from '../useSafenetShieldState'

jest.mock('../useFlowSafenetCheck', () => ({ useFlowSafenetCheck: jest.fn() }))

const mockUseFlowSafenetCheck = useFlowSafenetCheck as jest.MockedFunction<typeof useFlowSafenetCheck>

const withCheck = (publicStatus: PublicCheckStatus) =>
  mockUseFlowSafenetCheck.mockReturnValue({
    safeTxHash: faker.string.hexadecimal({ length: 64, casing: 'lower' }),
    submittedAt: 1,
    check: buildCheckView({ status: publicStatus, publicStatus }),
  })

const open = { enabled: true, isSafePro: true, hasProFeatures: true }
const render = (access = open) => renderHook(() => useSafenetShieldState(access)).result.current

describe('useSafenetShieldState', () => {
  it.each([
    [CheckStatus.SUBMITTED, { shown: true, passed: false }],
    [CheckStatus.BENIGN, { shown: true, passed: true }],
    [CheckStatus.MALICIOUS, { shown: true, passed: false }],
    [CheckStatus.UNAVAILABLE, { shown: false, passed: false }],
  ] as const)('%s counts as %o', (status, check) => {
    withCheck(status)
    expect(render().check).toEqual(check)
  })

  it('reports a Safenet risk for the header', () => {
    withCheck(CheckStatus.MALICIOUS)
    expect(render().risk).toEqual({ severity: Severity.CRITICAL, title: 'Risk detected' })
  })

  it('counts a locked row as a check that never passes, without reading the chain', () => {
    withCheck(CheckStatus.BENIGN)
    expect(render({ ...open, hasProFeatures: false })).toEqual({
      check: { shown: true, passed: false },
      risk: undefined,
    })
    expect(mockUseFlowSafenetCheck).toHaveBeenLastCalledWith(false)
  })

  it('adds nothing when disabled', () => {
    withCheck(CheckStatus.MALICIOUS)
    expect(render({ ...open, enabled: false })).toEqual({ check: { shown: false, passed: false }, risk: undefined })
  })
})
