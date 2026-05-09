import { calculatePositionsFiatTotal } from '../utils/calculatePositionsFiatTotal'
import type { Protocol } from '@safe-global/store/gateway/AUTO_GENERATED/positions'

const createMockProtocol = (fiatTotal: string): Protocol => ({
  protocol: 'test-protocol',
  protocol_metadata: {
    name: 'Test Protocol',
    icon: { url: 'https://example.com/icon.png' },
  },
  fiatTotal,
  items: [],
})

describe('calculatePositionsFiatTotal', () => {
  it('returns 0 for empty protocols array', () => {
    expect(calculatePositionsFiatTotal([])).toBe(0)
  })

  it('returns 0 for undefined protocols', () => {
    expect(calculatePositionsFiatTotal(undefined)).toBe(0)
  })

  it('calculates total for single protocol', () => {
    const protocols = [createMockProtocol('1500.50')]
    expect(calculatePositionsFiatTotal(protocols)).toBe(1500.5)
  })

  it('calculates total for multiple protocols', () => {
    const protocols = [createMockProtocol('1000'), createMockProtocol('500.25'), createMockProtocol('250.75')]
    expect(calculatePositionsFiatTotal(protocols)).toBe(1751)
  })

  it('handles protocols with zero value', () => {
    const protocols = [createMockProtocol('0'), createMockProtocol('100')]
    expect(calculatePositionsFiatTotal(protocols)).toBe(100)
  })

  it('handles protocols with string numbers correctly', () => {
    const protocols = [createMockProtocol('1234567.89')]
    expect(calculatePositionsFiatTotal(protocols)).toBe(1234567.89)
  })

  it('handles floating point precision', () => {
    const protocols = [createMockProtocol('0.1'), createMockProtocol('0.2')]
    expect(calculatePositionsFiatTotal(protocols)).toBeCloseTo(0.3)
  })
})
