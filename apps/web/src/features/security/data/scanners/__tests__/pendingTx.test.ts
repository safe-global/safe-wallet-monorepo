import { pendingTxScanner } from '../pendingTx'
import { createMockContext } from '../test-helpers'

describe('pendingTxScanner', () => {
  it('returns clear for 0 queued transactions', async () => {
    const result = await pendingTxScanner.scan(createMockContext({ queuedTxCount: 0 }))
    expect(result.status).toBe('clear')
    expect(result.score).toBe(100)
  })

  it('returns clear for 1 queued transaction', async () => {
    const result = await pendingTxScanner.scan(createMockContext({ queuedTxCount: 1 }))
    expect(result.status).toBe('clear')
  })

  it('returns clear for 2 queued transactions', async () => {
    const result = await pendingTxScanner.scan(createMockContext({ queuedTxCount: 2 }))
    expect(result.status).toBe('clear')
  })

  it('returns partial for 3 queued transactions', async () => {
    const result = await pendingTxScanner.scan(createMockContext({ queuedTxCount: 3 }))
    expect(result.status).toBe('partial')
    expect(result.severity).toBe('Medium')
    expect(result.score).toBe(60)
  })

  it('returns partial for 4 queued transactions', async () => {
    const result = await pendingTxScanner.scan(createMockContext({ queuedTxCount: 4 }))
    expect(result.status).toBe('partial')
  })

  it('returns issue for 5 queued transactions', async () => {
    const result = await pendingTxScanner.scan(createMockContext({ queuedTxCount: 5 }))
    expect(result.status).toBe('issue')
    expect(result.severity).toBe('High')
    expect(result.score).toBe(25)
  })

  it('returns issue for large queue', async () => {
    const result = await pendingTxScanner.scan(createMockContext({ queuedTxCount: 50 }))
    expect(result.status).toBe('issue')
  })

  it('includes transaction count in evidence', async () => {
    const result = await pendingTxScanner.scan(createMockContext({ queuedTxCount: 7 }))
    const evidence = result.evidence[0]
    expect(typeof evidence).toBe('object')
    if (typeof evidence === 'object') {
      expect(evidence.value).toContain('7')
    }
  })
})
