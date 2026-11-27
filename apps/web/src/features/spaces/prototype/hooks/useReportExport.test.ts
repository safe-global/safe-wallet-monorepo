import { act, renderHook } from '@/tests/test-utils'

import { buildSnapshot } from '../reportSnapshots'
import { SAMPLE_MONTHS, SAMPLE_SAFES } from '../sampleData'
import { useReportExport } from './useReportExport'

const snapshots = SAMPLE_MONTHS.map((month) => buildSnapshot(month, SAMPLE_SAFES))
const NOVEMBER = '2026-11'
const PREPARE_MS = 900

describe('useReportExport', () => {
  it('marks the row as preparing until the statement is ready', () => {
    const { result } = renderHook(() => useReportExport('active', snapshots))

    act(() => result.current.onExport(NOVEMBER))

    expect(result.current.exportingRowId).toBe(NOVEMBER)
    expect(result.current.statement).toBeUndefined()
  })

  it('opens the statement of the exported month', () => {
    const { result } = renderHook(() => useReportExport('active', snapshots))

    act(() => result.current.onExport(NOVEMBER))
    act(() => jest.advanceTimersByTime(PREPARE_MS * 2))

    expect(result.current.exportingRowId).toBeUndefined()
    expect(result.current.statement?.fileName).toBe('safe-balances_acme-treasury_2026-11-30.csv')
  })

  it.each(['exportFails', 'exportLimitReached'] as const)('shows an error and no statement when %s', (scenario) => {
    const { result } = renderHook(() => useReportExport(scenario, snapshots))

    act(() => result.current.onExport(NOVEMBER))
    act(() => jest.advanceTimersByTime(PREPARE_MS * 2))

    expect(result.current.exportError).toEqual(expect.any(String))
    expect(result.current.statement).toBeUndefined()
  })

  it('closes the statement', () => {
    const { result } = renderHook(() => useReportExport('active', snapshots))
    act(() => result.current.onExport(NOVEMBER))
    act(() => jest.advanceTimersByTime(PREPARE_MS * 2))

    act(() => result.current.onCloseStatement())

    expect(result.current.statement).toBeUndefined()
  })
})
