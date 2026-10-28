import { isUntrusted } from '../components/RiskFlag'
import { getOpsKind, getSignerLoad, hasConflicts, isStale, pinConflicting } from './fleet'
import { matchesFlag } from '../components/QueueFilters/useQueueFilters'
import type { Flag } from '../components/shared'
import { getScenario, getScenarioAccounts } from './model'
import { rankAccounts } from '../components/QueueTable/sections'
import type { Proposal } from '../types'

const items = getScenario('50-safes')
const accounts = getScenarioAccounts('50-safes')
const byId = (id: string) => items.find((tx) => tx.id.startsWith(id))!

describe('fleet admin', () => {
  it('builds a 50-Safe protocol workspace', () => {
    expect(accounts).toHaveLength(50)
    expect(new Set(accounts.map((account) => account.id)).size).toBe(50)
    expect(items.every((tx) => accounts.some((account) => account.id === tx.account))).toBe(true)
  })

  it('tags emergencies, config changes and routine work', () => {
    expect(getOpsKind(byId('security-ethereum'))).toBe('emergency')
    expect(getOpsKind(byId('market-ethereum'))).toBe('config')
    expect(getOpsKind(byId('liquidity-ethereum'))).toBe('routine')
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

describe('fleet admin scenario', () => {
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

  it('pins Safes with conflicting transactions to the top and keeps the rest in order', () => {
    const ids = fleetAccounts.map((account) => account.id)
    const conflicting = ids.filter((id) => hasConflicts(id, fleetItems))
    expect(conflicting.length).toBeGreaterThan(0)
    expect(pinConflicting(ids, fleetItems)).toEqual([...conflicting, ...ids.filter((id) => !conflicting.includes(id))])
  })

  it.each(['owner', 'single', 'security', 'member', 'admin'] as const)(
    'puts five busy Safes at the top for %s',
    (persona) => {
      const order = pinConflicting(
        rankAccounts(fleetAccounts, fleetItems, persona).map((account) => account.id),
        fleetItems,
      )
      for (const id of order.slice(0, 5)) {
        const queued = fleetItems.filter((tx) => tx.account === id).length
        expect(queued).toBeGreaterThanOrEqual(5)
        expect(queued).toBeLessThanOrEqual(10)
      }
    },
  )
})
