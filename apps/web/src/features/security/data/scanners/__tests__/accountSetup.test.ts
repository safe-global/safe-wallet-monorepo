import { accountSetupScanner } from '../accountSetup'
import { createMockContext } from '../test-helpers'

describe('accountSetupScanner', () => {
  it('returns critical issue for single signer', async () => {
    const ctx = createMockContext({
      owners: [{ value: '0x1111111111111111111111111111111111111111' }],
      threshold: 1,
    })
    const result = await accountSetupScanner.scan(ctx)
    expect(result.status).toBe('issue')
    expect(result.severity).toBe('Critical')
    expect(result.score).toBe(10)
  })

  it('returns critical issue for threshold of 1 with multiple owners', async () => {
    const ctx = createMockContext({ threshold: 1 })
    const result = await accountSetupScanner.scan(ctx)
    expect(result.status).toBe('issue')
    expect(result.severity).toBe('Critical')
    expect(result.score).toBe(15)
  })

  it('recommends adding a signer for a 1/2 Safe (avoids 2/2 single point of failure)', async () => {
    const ctx = createMockContext({
      owners: [
        { value: '0x1111111111111111111111111111111111111111' },
        { value: '0x2222222222222222222222222222222222222222' },
      ],
      threshold: 1,
    })
    const result = await accountSetupScanner.scan(ctx)
    expect(result.status).toBe('issue')
    expect(result.severity).toBe('Critical')
    expect(result.score).toBe(15)
    expect(result.remediation).toContain('Add another signer')
    expect(result.remediation).not.toContain('2 of 2')
  })

  it('returns partial for threshold below simple majority', async () => {
    const ctx = createMockContext({
      owners: [
        { value: '0x1111111111111111111111111111111111111111' },
        { value: '0x2222222222222222222222222222222222222222' },
        { value: '0x3333333333333333333333333333333333333333' },
        { value: '0x4444444444444444444444444444444444444444' },
      ],
      threshold: 1,
    })
    const result = await accountSetupScanner.scan(ctx)
    expect(result.status).toBe('issue')
    expect(result.severity).toBe('Critical')
  })

  it('returns partial for threshold below majority (e.g., 2 of 5)', async () => {
    const ctx = createMockContext({
      owners: Array.from({ length: 5 }, (_, i) => ({
        value: `0x${String(i + 1).padStart(40, '0')}`,
      })),
      threshold: 2,
    })
    const result = await accountSetupScanner.scan(ctx)
    expect(result.status).toBe('partial')
    expect(result.severity).toBe('Medium')
  })

  it('returns partial for 2 of 4 (half is not a simple majority)', async () => {
    const ctx = createMockContext({
      owners: Array.from({ length: 4 }, (_, i) => ({
        value: `0x${String(i + 1).padStart(40, '0')}`,
      })),
      threshold: 2,
    })
    const result = await accountSetupScanner.scan(ctx)
    expect(result.status).toBe('partial')
    expect(result.severity).toBe('Medium')
    expect(result.remediation).toContain('3 of 4')
  })

  it('returns clear for 3 of 4 (strict majority)', async () => {
    const ctx = createMockContext({
      owners: Array.from({ length: 4 }, (_, i) => ({
        value: `0x${String(i + 1).padStart(40, '0')}`,
      })),
      threshold: 3,
    })
    const result = await accountSetupScanner.scan(ctx)
    expect(result.status).toBe('clear')
    expect(result.severity).toBe('Low')
  })

  it('recommends 3 of 4 for a 1/4 Safe (strict majority, not half)', async () => {
    const ctx = createMockContext({
      owners: Array.from({ length: 4 }, (_, i) => ({
        value: `0x${String(i + 1).padStart(40, '0')}`,
      })),
      threshold: 1,
    })
    const result = await accountSetupScanner.scan(ctx)
    expect(result.status).toBe('issue')
    expect(result.remediation).toContain('3 of 4')
  })

  it('returns clear for threshold at simple majority', async () => {
    const ctx = createMockContext({ threshold: 2 })
    const result = await accountSetupScanner.scan(ctx)
    expect(result.status).toBe('clear')
    expect(result.severity).toBe('Low')
    expect(result.score).toBe(100)
  })

  it('returns clear for threshold above simple majority', async () => {
    const ctx = createMockContext({ threshold: 3 })
    const result = await accountSetupScanner.scan(ctx)
    expect(result.status).toBe('clear')
  })

  it('returns inconclusive when owner data has not loaded yet', async () => {
    // ownerCount === 0 is impossible for a real Safe — treat it as transient missing
    // data, not a security concern, so the score isn't penalized while safeInfo loads.
    const ctx = createMockContext({ owners: [] })
    const result = await accountSetupScanner.scan(ctx)
    expect(result.status).toBe('inconclusive')
    expect(result.severity).toBe('Low')
  })
})
