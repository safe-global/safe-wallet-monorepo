import { isUntrusted } from '../components/RiskFlag'
import { getSignerLoad, isStale } from './flags'
import { matchesFlag } from '../components/QueueFilters/useQueueFilters'
import type { Flag } from '../components/shared'
import { getScenario, getScenarioAccounts } from './model'
import type { Proposal } from '../types'

const items = getScenario('50-safes')
const accounts = getScenarioAccounts('50-safes')

describe('50-Safe workspace', () => {
  it('builds a 50-Safe protocol workspace', () => {
    expect(accounts).toHaveLength(50)
    expect(new Set(accounts.map((account) => account.id)).size).toBe(50)
    expect(items.every((tx) => accounts.some((account) => account.id === tx.account))).toBe(true)
  })

  it('marks proposals older than a week as stale', () => {
    const tx = (age: string) => ({ ...items[0], age }) as Proposal
    expect(isStale(tx('8d ago'))).toBe(true)
    expect(isStale(tx('6d ago'))).toBe(false)
  })

  it('counts conflicting proposals across the fleet', () => {
    // Two pairs, plus the three-way conflict from the mix.
    expect(items.filter((tx) => matchesFlag(tx, 'conflicting', items))).toHaveLength(7)
  })

  it('lists every signer, ranked by how many proposals wait on them', () => {
    const load = getSignerLoad(items, accounts, 'owner')
    expect(load[0].id).toBe('Lena')
    // Signers with nothing waiting are still listed, last.
    expect(load.at(-1)).toMatchObject({ id: 'Omar', txs: [] })
    expect(load.every((signer, index) => index === 0 || load[index - 1].txs.length >= signer.txs.length)).toBe(true)
    expect(load.find((signer) => signer.id.startsWith('0x'))?.member).toBe(false)
  })
})

describe('20-Safe workspace', () => {
  const fleetItems = getScenario('20-safes')
  const fleetAccounts = getScenarioAccounts('20-safes')
  const count = (flag: Flag) => fleetItems.filter((tx) => matchesFlag(tx, flag, fleetItems)).length

  it('has 20 Safes and 11 signers, with conflicts, untrusted and stale proposals', () => {
    expect(fleetAccounts).toHaveLength(20)
    expect(new Set(fleetAccounts.flatMap((account) => account.owners)).size).toBe(11)
    expect(fleetItems.every((tx) => fleetAccounts.some((account) => account.id === tx.account))).toBe(true)
    expect(new Set(fleetItems.map((tx) => tx.id)).size).toBe(fleetItems.length)
    expect(count('conflicting')).toBeGreaterThanOrEqual(4)
    expect(fleetItems.filter(isUntrusted)).toHaveLength(3)
    expect(count('stale')).toBe(5)
  })
})
