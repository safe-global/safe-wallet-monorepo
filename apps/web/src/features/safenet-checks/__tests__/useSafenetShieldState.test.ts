import { faker } from '@faker-js/faker'
import { renderHook } from '@/tests/test-utils'
import { Severity } from '@safe-global/utils/features/safe-shield/types'
import { CheckStatus, type PublicCheckStatus } from '@safe-global/utils/features/safenet-checks'
import { buildCheckView } from '@safe-global/utils/features/safenet-checks/builders'
import { useFlowSafenetCheck, type FlowSafenetCheck } from '../useFlowSafenetCheck'
import { useSafenetShieldState } from '../useSafenetShieldState'

jest.mock('../useFlowSafenetCheck', () => ({ useFlowSafenetCheck: jest.fn() }))

const mockUseFlowSafenetCheck = useFlowSafenetCheck as jest.MockedFunction<typeof useFlowSafenetCheck>

const withCheck = (publicStatus: PublicCheckStatus, over: Partial<FlowSafenetCheck> = {}, isLoading = false) =>
  mockUseFlowSafenetCheck.mockReturnValue({
    safeTxHash: faker.string.hexadecimal({ length: 64, casing: 'lower' }),
    submittedAt: 1,
    isTxDetailsLoading: false,
    check: buildCheckView({ status: publicStatus, publicStatus, isLoading }),
    ...over,
  })

const open = { enabled: true, isSafePro: true, hasProFeatures: true }
const render = (access = open) => renderHook(() => useSafenetShieldState(access)).result.current

describe('useSafenetShieldState', () => {
  it.each([
    [CheckStatus.SUBMITTED, { shown: true, passed: false }, true],
    [CheckStatus.IN_PROGRESS, { shown: true, passed: false }, true],
    [CheckStatus.BENIGN, { shown: true, passed: true }, false],
    [CheckStatus.MALICIOUS, { shown: true, passed: false }, false],
    [CheckStatus.TIMED_OUT, { shown: true, passed: false }, false],
    [CheckStatus.UNAVAILABLE, { shown: false, passed: false }, false],
  ] as const)('%s counts as %o and running %s', (status, check, isRunning) => {
    withCheck(status)
    expect(render()).toMatchObject({ check, isRunning, isBenign: status === CheckStatus.BENIGN })
  })

  it('is running while the first chain read is in flight', () => {
    withCheck(CheckStatus.UNAVAILABLE, {}, true)
    expect(render()).toMatchObject({ isRunning: true, check: { shown: false } })
  })

  it('is running while the transaction details that start the read are loading', () => {
    withCheck(CheckStatus.UNAVAILABLE, { submittedAt: undefined, isTxDetailsLoading: true })
    expect(render().isRunning).toBe(true)
  })

  it('reports a Safenet risk with its header status', () => {
    withCheck(CheckStatus.MALICIOUS)
    expect(render().risk).toEqual({ severity: Severity.CRITICAL, title: 'Risk detected' })

    withCheck(CheckStatus.BENIGN)
    expect(render().risk).toBeUndefined()
  })

  it('has nothing to count or wait for before the transaction is proposed', () => {
    withCheck(
      CheckStatus.UNAVAILABLE,
      { safeTxHash: undefined, submittedAt: undefined, isTxDetailsLoading: true },
      true,
    )
    expect(render()).toMatchObject({ check: { shown: false }, isRunning: false })
  })

  it('counts a locked row as a check that never passes and never reads the chain', () => {
    withCheck(CheckStatus.BENIGN)
    expect(render({ ...open, hasProFeatures: false })).toMatchObject({
      check: { shown: true, passed: false },
      isRunning: false,
      isBenign: false,
      risk: undefined,
    })
    expect(mockUseFlowSafenetCheck).toHaveBeenLastCalledWith(false)
  })

  it('reads the check in the open list when Safe Pro is off', () => {
    withCheck(CheckStatus.IN_PROGRESS)
    expect(render({ enabled: true, isSafePro: false, hasProFeatures: false }).isRunning).toBe(true)
  })

  it('stays out of the header and badge when disabled', () => {
    withCheck(CheckStatus.MALICIOUS)
    expect(render({ ...open, enabled: false })).toMatchObject({
      check: { shown: false },
      isRunning: false,
      risk: undefined,
    })
  })
})
