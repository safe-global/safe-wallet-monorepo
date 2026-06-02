import { Severity } from '../../types'
import { sliceTopBySeverity } from '../sliceTopBySeverity'

describe('sliceTopBySeverity', () => {
  const item = (severity: Severity, id: string) => ({ severity, id })

  it('returns empty visible and zero overflow for empty input', () => {
    expect(sliceTopBySeverity([], 3)).toEqual({ visible: [], overflow: 0 })
  })

  it('returns all items and zero overflow when length <= cap', () => {
    const items = [item(Severity.WARN, 'a'), item(Severity.INFO, 'b')]
    const result = sliceTopBySeverity(items, 3)
    expect(result.visible).toHaveLength(2)
    expect(result.overflow).toBe(0)
  })

  it('caps at the supplied cap and reports overflow count', () => {
    const items = [
      item(Severity.INFO, 'a'),
      item(Severity.INFO, 'b'),
      item(Severity.INFO, 'c'),
      item(Severity.INFO, 'd'),
      item(Severity.INFO, 'e'),
    ]
    const result = sliceTopBySeverity(items, 3)
    expect(result.visible).toHaveLength(3)
    expect(result.overflow).toBe(2)
  })

  it('sorts CRITICAL before WARN before INFO before OK', () => {
    const items = [
      item(Severity.OK, 'ok'),
      item(Severity.INFO, 'info'),
      item(Severity.CRITICAL, 'crit'),
      item(Severity.WARN, 'warn'),
    ]
    const result = sliceTopBySeverity(items, 4)
    expect(result.visible.map((i) => i.id)).toEqual(['crit', 'warn', 'info', 'ok'])
  })

  it('treats ERROR and WARN as equal priority and preserves input order between them', () => {
    const items = [item(Severity.ERROR, 'err-1'), item(Severity.WARN, 'warn-1'), item(Severity.ERROR, 'err-2')]
    const result = sliceTopBySeverity(items, 3)
    expect(result.visible.map((i) => i.id)).toEqual(['err-1', 'warn-1', 'err-2'])
  })

  it('does not mutate the input array', () => {
    const items = [item(Severity.INFO, 'a'), item(Severity.CRITICAL, 'b')]
    const snapshot = [...items]
    sliceTopBySeverity(items, 3)
    expect(items).toEqual(snapshot)
  })
})
