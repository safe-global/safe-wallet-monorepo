import { accountSetupScanner } from '../accountSetup'
import { guardScanner } from '../guard'
import { pendingTxScanner } from '../pendingTx'
import { recoveryScanner } from '../recovery'
import { multichainSetupScanner } from '../multichainSetup'
import { contractVersionScanner } from '../contractVersion'
import { modulesScanner } from '../modules'
import { transactionScanningScanner } from '../transactionScanning'
import { fallbackHandlerScanner } from '../fallbackHandler'
import { factoryValidationScanner } from '../factoryValidation'
import { createMockContext } from '../test-helpers'

/**
 * These tests verify that scanners produce CORRECT results when given
 * real data vs default/zero values. This catches bugs where the scan
 * context fires before all data has loaded (e.g., safeOverview not yet
 * resolved), causing incorrect "Healthy" results that only correct on rescan.
 */
describe('scanner accuracy with real vs default data', () => {
  describe('pendingTxScanner', () => {
    it('should NOT return clear when Safe actually has 5+ queued transactions', async () => {
      const result = await pendingTxScanner.scan(createMockContext({ queuedTxCount: 7 }))
      expect(result.status).not.toBe('clear')
      expect(result.status).toBe('issue')
    })

    it('correctly distinguishes 0 queued (clear) from 5 queued (issue)', async () => {
      const clearResult = await pendingTxScanner.scan(createMockContext({ queuedTxCount: 0 }))
      const issueResult = await pendingTxScanner.scan(createMockContext({ queuedTxCount: 5 }))
      expect(clearResult.status).toBe('clear')
      expect(issueResult.status).toBe('issue')
      expect(clearResult.status).not.toBe(issueResult.status)
    })
  })

  describe('guardScanner', () => {
    it('should NOT return clear when high-value Safe on supported chain has no guard', async () => {
      const result = await guardScanner.scan(
        createMockContext({
          guard: null,
          chainSupportsHypernative: true,
          balanceUsd: 2_000_000,
        }),
      )
      expect(result.status).not.toBe('clear')
      expect(result.status).toBe('partial')
      expect(result.partner).toBe('hypernative')
    })

    it('correctly distinguishes 0 balance (clear) from high balance (partial) on supported chain', async () => {
      const base = { guard: null, chainSupportsHypernative: true }
      const clearResult = await guardScanner.scan(createMockContext({ ...base, balanceUsd: 0 }))
      const partialResult = await guardScanner.scan(createMockContext({ ...base, balanceUsd: 2_000_000 }))
      expect(clearResult.status).toBe('clear')
      expect(partialResult.status).toBe('partial')
    })
  })

  describe('multichainSetupScanner', () => {
    it('should NOT return clear when signers are inconsistent', async () => {
      const result = await multichainSetupScanner.scan(
        createMockContext({
          isMultichain: true,
          multichainSignersConsistent: false,
          multichainDeviatingChains: ['Polygon'],
        }),
      )
      expect(result.status).not.toBe('clear')
      expect(result.status).toBe('partial')
    })
  })

  describe('all scanners produce lastChecked timestamp', () => {
    it.each([
      ['accountSetup', accountSetupScanner],
      ['guard', guardScanner],
      ['pendingTx', pendingTxScanner],
      ['recovery', recoveryScanner],
      ['multichainSetup', multichainSetupScanner],
      ['contractVersion', contractVersionScanner],
      ['modules', modulesScanner],
      ['transactionScanning', transactionScanningScanner],
      ['fallbackHandler', fallbackHandlerScanner],
      ['factoryValidation', factoryValidationScanner],
    ])('%s scanner includes lastChecked', async (_name, scanner) => {
      const result = await scanner.scan(createMockContext())
      expect(result.lastChecked).toBeDefined()
      expect(() => new Date(result.lastChecked)).not.toThrow()
    })
  })

  describe('all scanners return valid status and severity', () => {
    it.each([
      ['accountSetup', accountSetupScanner],
      ['guard', guardScanner],
      ['pendingTx', pendingTxScanner],
      ['recovery', recoveryScanner],
      ['multichainSetup', multichainSetupScanner],
      ['contractVersion', contractVersionScanner],
      ['modules', modulesScanner],
      ['transactionScanning', transactionScanningScanner],
      ['fallbackHandler', fallbackHandlerScanner],
      ['factoryValidation', factoryValidationScanner],
    ])('%s scanner returns valid status and severity', async (_name, scanner) => {
      const result = await scanner.scan(createMockContext())
      expect(['clear', 'issue', 'partial', 'not_applicable', 'inconclusive']).toContain(result.status)
      expect(['Low', 'Medium', 'High', 'Critical']).toContain(result.severity)
      expect(result.score).toBeGreaterThanOrEqual(0)
      expect(result.score).toBeLessThanOrEqual(100)
      expect(Array.isArray(result.evidence)).toBe(true)
    })
  })
})
