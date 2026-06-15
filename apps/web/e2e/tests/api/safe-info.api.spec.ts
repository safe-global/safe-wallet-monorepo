/**
 * Safe API tests — pure API validation, no browser needed.
 *
 * These tests verify the CGW API returns correct data for known test Safes.
 * They run fast, are highly stable, and catch backend regressions early.
 */
import { test, expect } from '../../src/fixtures/test.fixture'
import { SAFES, CHAIN_IDS } from '../../src/data/constants'

// Extract the raw address from prefixed format "sep:0xABC..." → "0xABC..."
const safeAddress = SAFES.SEP_STATIC_SAFE_1.split(':')[1]

test.describe('Safe Info API', { tag: '@api' }, () => {
  test('should return Safe info with valid structure', async ({ safeApiClient }) => {
    const info = await safeApiClient.getSafeInfo(safeAddress)

    expect(info.address.value).toBeTruthy()
    expect(info.chainId).toBe(CHAIN_IDS.sepolia)
    expect(info.threshold).toBeGreaterThan(0)
    expect(info.owners.length).toBeGreaterThan(0)
  })

  test('should return owners as an array of addresses', async ({ safeApiClient }) => {
    const info = await safeApiClient.getSafeInfo(safeAddress)

    for (const owner of info.owners) {
      expect(owner.value).toMatch(/^0x[a-fA-F0-9]{40}$/)
    }
  })

  test('should return balances for the Safe', async ({ safeApiClient }) => {
    const balances = await safeApiClient.getBalances(safeAddress)

    expect(balances.fiatTotal).toBeDefined()
    expect(balances.items).toBeInstanceOf(Array)
  })

  test('should report CGW as healthy', async ({ safeApiClient }) => {
    const healthy = await safeApiClient.isHealthy()
    expect(healthy).toBe(true)
  })
})
