import { transactionScanningScanner } from '../transactionScanning'
import { createMockContext } from '../test-helpers'

describe('transactionScanningScanner', () => {
  it('returns clear when chain supports transaction scanning', async () => {
    const result = await transactionScanningScanner.scan(createMockContext({ chainSupportsTransactionScanning: true }))
    expect(result.status).toBe('clear')
    expect(result.severity).toBe('Low')
    expect(result.score).toBe(100)
  })

  it('returns not_applicable when chain does not support transaction scanning', async () => {
    const result = await transactionScanningScanner.scan(createMockContext({ chainSupportsTransactionScanning: false }))
    expect(result.status).toBe('not_applicable')
    expect(result.severity).toBe('Low')
    expect(result.score).toBe(70)
  })

  it('includes lastChecked timestamp', async () => {
    const result = await transactionScanningScanner.scan(createMockContext())
    expect(result.lastChecked).toBeDefined()
    expect(() => new Date(result.lastChecked)).not.toThrow()
  })
})
