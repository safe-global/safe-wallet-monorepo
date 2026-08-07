import { renderHook } from '@testing-library/react'
import type { AsyncResult } from '@safe-global/utils/hooks/useAsync'
import { useThreatAnalysisWithGuard } from '../useThreatAnalysisWithGuard'
import { useGuardCheck, type InvalidGuardResult } from '../useGuardCheck'
import { Severity, ThreatStatus, type ThreatAnalysisResults } from '../../types'

jest.mock('../useGuardCheck', () => ({
  useGuardCheck: jest.fn(),
}))

const mockedUseGuardCheck = useGuardCheck as jest.Mock

const invalidGuard: InvalidGuardResult = {
  severity: Severity.CRITICAL,
  type: ThreatStatus.INVALID_GUARD,
  title: 'Invalid transaction guard',
  description: 'nope',
  addresses: [{ address: '0xguard' }],
}

const threatResults = {
  THREAT: [{ type: ThreatStatus.MALICIOUS }],
  CUSTOM_CHECKS: [{ type: ThreatStatus.CUSTOM_CHECKS_FAILED }],
  BALANCE_CHANGE: [],
  request_id: 'req-1',
} as unknown as ThreatAnalysisResults

const renderWrapper = (threat: AsyncResult<ThreatAnalysisResults> | undefined) =>
  renderHook(() => useThreatAnalysisWithGuard(threat, { safeTx: undefined, safeAddress: '0x1', safeVersion: '1.3.0' }))

describe('useThreatAnalysisWithGuard', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns the threat result untouched when there is no invalid-guard finding', () => {
    mockedUseGuardCheck.mockReturnValue([[], undefined, false])

    const { result } = renderWrapper([threatResults, undefined, false])

    expect(result.current[0]).toBe(threatResults)
  })

  it('prepends the guard finding to THREAT and preserves other groups', () => {
    mockedUseGuardCheck.mockReturnValue([[invalidGuard], undefined, false])

    const { result } = renderWrapper([threatResults, undefined, false])
    const [merged] = result.current

    expect(merged?.THREAT?.[0]).toBe(invalidGuard)
    expect(merged?.THREAT).toHaveLength(2)
    expect(merged?.CUSTOM_CHECKS).toEqual(threatResults.CUSTOM_CHECKS)
    expect(merged?.BALANCE_CHANGE).toEqual(threatResults.BALANCE_CHANGE)
    expect(merged?.request_id).toBe('req-1')
  })

  it('surfaces a guard finding even when the threat result is still empty', () => {
    mockedUseGuardCheck.mockReturnValue([[invalidGuard], undefined, false])

    const { result } = renderWrapper([undefined, undefined, false])

    expect(result.current[0]?.THREAT).toEqual([invalidGuard])
  })

  it('stays loading while either the threat or the guard check is loading', () => {
    mockedUseGuardCheck.mockReturnValue([undefined, undefined, true])

    const { result } = renderWrapper([threatResults, undefined, false])

    expect(result.current[2]).toBe(true)
  })

  it('passes through the threat error', () => {
    mockedUseGuardCheck.mockReturnValue([[], undefined, false])
    const error = new Error('threat failed')

    const { result } = renderWrapper([undefined, error, false])

    expect(result.current[1]).toBe(error)
  })
})
