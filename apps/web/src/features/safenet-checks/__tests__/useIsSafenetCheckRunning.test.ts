import { renderHook } from '@/tests/test-utils'
import { CheckStatus, type PublicCheckStatus } from '@safe-global/utils/features/safenet-checks'
import { buildCheckView } from '@safe-global/utils/features/safenet-checks/builders'
import { useFlowSafenetCheck } from '../useFlowSafenetCheck'
import { useIsSafenetCheckBenign, useIsSafenetCheckRunning } from '../useIsSafenetCheckRunning'

jest.mock('../useFlowSafenetCheck', () => ({ useFlowSafenetCheck: jest.fn() }))

const mockUseFlowSafenetCheck = useFlowSafenetCheck as jest.MockedFunction<typeof useFlowSafenetCheck>

const withStatus = (publicStatus: PublicCheckStatus) =>
  mockUseFlowSafenetCheck.mockReturnValue({
    safeTxHash: undefined,
    submittedAt: undefined,
    check: buildCheckView({ status: publicStatus, publicStatus }),
  } as ReturnType<typeof useFlowSafenetCheck>)

describe('useIsSafenetCheckRunning', () => {
  it.each([
    [CheckStatus.SUBMITTED, true],
    [CheckStatus.IN_PROGRESS, true],
    [CheckStatus.BENIGN, false],
    [CheckStatus.MALICIOUS, false],
    [CheckStatus.TIMED_OUT, false],
    [CheckStatus.UNAVAILABLE, false],
  ] as const)('%s → running %s', (status, expected) => {
    withStatus(status)
    expect(renderHook(() => useIsSafenetCheckRunning(true)).result.current).toBe(expected)
  })

  it('is false while disabled, whatever the status', () => {
    withStatus(CheckStatus.IN_PROGRESS)
    expect(renderHook(() => useIsSafenetCheckRunning(false)).result.current).toBe(false)
  })
})

describe('useIsSafenetCheckBenign', () => {
  it('is true only for no issues found', () => {
    withStatus(CheckStatus.BENIGN)
    expect(renderHook(() => useIsSafenetCheckBenign(true)).result.current).toBe(true)

    withStatus(CheckStatus.MALICIOUS)
    expect(renderHook(() => useIsSafenetCheckBenign(true)).result.current).toBe(false)
  })

  it('is false while disabled', () => {
    withStatus(CheckStatus.BENIGN)
    expect(renderHook(() => useIsSafenetCheckBenign(false)).result.current).toBe(false)
  })
})
