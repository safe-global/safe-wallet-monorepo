import { accountSetupScanner } from '../accountSetup'
import { createMockContext } from '../test-helpers'

const DELAY_MODULE = { value: '0xabcdef1234567890abcdef1234567890abcdef12', name: 'Delay Modifier' }

const owners = (count: number) =>
  Array.from({ length: count }, (_, i) => ({ value: `0x${String(i + 1).padStart(40, '0')}` }))

describe('accountSetupScanner', () => {
  describe('n/n Safes (threshold === owner count)', () => {
    it('returns clear for a 1/1 Safe with recovery configured', async () => {
      const ctx = createMockContext({
        owners: owners(1),
        threshold: 1,
        chainSupportsRecovery: true,
        modules: [DELAY_MODULE],
      })
      const result = await accountSetupScanner.scan(ctx)
      expect(result.status).toBe('clear')
      expect(result.severity).toBe('Low')
      expect(result.score).toBe(100)
    })

    it('returns clear for a 2/2 Safe with recovery configured', async () => {
      const ctx = createMockContext({
        owners: owners(2),
        threshold: 2,
        chainSupportsRecovery: true,
        modules: [DELAY_MODULE],
      })
      const result = await accountSetupScanner.scan(ctx)
      expect(result.status).toBe('clear')
      expect(result.score).toBe(100)
    })

    it('returns clear for a 3/3 Safe with recovery configured', async () => {
      const ctx = createMockContext({
        owners: owners(3),
        threshold: 3,
        chainSupportsRecovery: true,
        modules: [DELAY_MODULE],
      })
      const result = await accountSetupScanner.scan(ctx)
      expect(result.status).toBe('clear')
    })

    it('returns an at-risk issue for a 2/2 Safe without recovery on a recovery-capable chain', async () => {
      const ctx = createMockContext({
        owners: owners(2),
        threshold: 2,
        chainSupportsRecovery: true,
        modules: null,
      })
      const result = await accountSetupScanner.scan(ctx)
      expect(result.status).toBe('issue')
      expect(result.severity).toBe('High')
      expect(result.score).toBe(40)
      expect(result.remediation).toContain('recovery')
    })

    it('returns an at-risk issue for a 3/3 Safe without recovery on a recovery-capable chain', async () => {
      const ctx = createMockContext({
        owners: owners(3),
        threshold: 3,
        chainSupportsRecovery: true,
        modules: null,
      })
      const result = await accountSetupScanner.scan(ctx)
      expect(result.status).toBe('issue')
      expect(result.severity).toBe('High')
      expect(result.score).toBe(40)
    })

    it('returns an at-risk issue for a 1/1 Safe without recovery on a recovery-capable chain', async () => {
      const ctx = createMockContext({
        owners: owners(1),
        threshold: 1,
        chainSupportsRecovery: true,
        modules: null,
      })
      const result = await accountSetupScanner.scan(ctx)
      expect(result.status).toBe('issue')
      expect(result.severity).toBe('High')
      expect(result.score).toBe(40)
    })

    it('does not count an unrecognized module as recovery (2/2 stays an issue)', async () => {
      const ctx = createMockContext({
        owners: owners(2),
        threshold: 2,
        chainSupportsRecovery: true,
        modules: [{ value: '0xabcdef1234567890abcdef1234567890abcdef12', name: 'SomeOtherModule' }],
      })
      const result = await accountSetupScanner.scan(ctx)
      expect(result.status).toBe('issue')
      expect(result.severity).toBe('High')
    })

    it('returns a critical issue for a 2/2 Safe on a chain without recovery support', async () => {
      const ctx = createMockContext({
        owners: owners(2),
        threshold: 2,
        chainSupportsRecovery: false,
        modules: null,
      })
      const result = await accountSetupScanner.scan(ctx)
      expect(result.status).toBe('issue')
      expect(result.severity).toBe('Critical')
      expect(result.score).toBe(10)
    })

    it('returns a critical issue for a 1/1 Safe on a chain without recovery support', async () => {
      const ctx = createMockContext({
        owners: owners(1),
        threshold: 1,
        chainSupportsRecovery: false,
        modules: null,
      })
      const result = await accountSetupScanner.scan(ctx)
      expect(result.status).toBe('issue')
      expect(result.severity).toBe('Critical')
      expect(result.score).toBe(10)
    })
  })

  describe('non-n/n Safes (unchanged behavior)', () => {
    it('returns critical issue for threshold of 1 with multiple owners', async () => {
      const ctx = createMockContext({ owners: owners(3), threshold: 1 })
      const result = await accountSetupScanner.scan(ctx)
      expect(result.status).toBe('issue')
      expect(result.severity).toBe('Critical')
      expect(result.score).toBe(15)
    })

    it('recommends adding a signer for a 1/2 Safe (avoids 2/2 single point of failure)', async () => {
      const ctx = createMockContext({ owners: owners(2), threshold: 1 })
      const result = await accountSetupScanner.scan(ctx)
      expect(result.status).toBe('issue')
      expect(result.severity).toBe('Critical')
      expect(result.score).toBe(15)
      expect(result.remediation).toContain('Add another signer')
      expect(result.remediation).not.toContain('2 of 2')
    })

    it('returns partial for threshold below majority (e.g., 2 of 5)', async () => {
      const ctx = createMockContext({ owners: owners(5), threshold: 2 })
      const result = await accountSetupScanner.scan(ctx)
      expect(result.status).toBe('partial')
      expect(result.severity).toBe('Medium')
    })

    it('returns partial for 2 of 4 (half is not a simple majority)', async () => {
      const ctx = createMockContext({ owners: owners(4), threshold: 2 })
      const result = await accountSetupScanner.scan(ctx)
      expect(result.status).toBe('partial')
      expect(result.severity).toBe('Medium')
      expect(result.remediation).toContain('3 of 4')
    })

    it('returns clear for 3 of 4 (strict majority, not n/n)', async () => {
      const ctx = createMockContext({ owners: owners(4), threshold: 3 })
      const result = await accountSetupScanner.scan(ctx)
      expect(result.status).toBe('clear')
      expect(result.severity).toBe('Low')
    })

    it('recommends 3 of 4 for a 1/4 Safe (strict majority, not half)', async () => {
      const ctx = createMockContext({ owners: owners(4), threshold: 1 })
      const result = await accountSetupScanner.scan(ctx)
      expect(result.status).toBe('issue')
      expect(result.remediation).toContain('3 of 4')
    })

    it('returns clear for threshold at simple majority (2 of 3)', async () => {
      const ctx = createMockContext({ owners: owners(3), threshold: 2 })
      const result = await accountSetupScanner.scan(ctx)
      expect(result.status).toBe('clear')
      expect(result.severity).toBe('Low')
      expect(result.score).toBe(100)
    })

    it('returns clear for threshold above simple majority (4 of 5)', async () => {
      const ctx = createMockContext({ owners: owners(5), threshold: 4 })
      const result = await accountSetupScanner.scan(ctx)
      expect(result.status).toBe('clear')
    })
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
