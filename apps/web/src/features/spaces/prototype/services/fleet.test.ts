import { getOpsKind, getPulse, getSignerLoad, isStale, pinEmergencies } from './fleet'
import { getScenario, getScenarioAccounts } from './model'
import { rankAccounts } from '../components/QueueTable/sections'
import type { Proposal } from '../types'

const items = getScenario('protocol')
const accounts = getScenarioAccounts('protocol')
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

  it('shows the same fleet signals to everyone', () => {
    const keys = (persona: Parameters<typeof getPulse>[1]) => getPulse(items, persona).map(({ key }) => key)
    expect(keys('security')).toEqual(['conflicting', 'untrusted', 'stale'])
    expect(keys('owner')).toEqual(keys('security'))
  })

  it('counts conflicting proposals across the fleet', () => {
    const conflicting = getPulse(items, 'owner').find(({ key }) => key === 'conflicting')?.count
    expect(conflicting).toBe(4)
  })

  it('lists every signer, ranked by how many proposals wait on them', () => {
    const load = getSignerLoad(items, accounts, 'owner')
    expect(load[0].id).toBe('Lena')
    // Signers with nothing waiting are still listed, last.
    expect(load.at(-1)).toMatchObject({ id: 'Omar', txs: [] })
    expect(load.every((signer, index) => index === 0 || load[index - 1].txs.length >= signer.txs.length)).toBe(true)
    expect(load.find((signer) => signer.id.startsWith('0x'))?.member).toBe(false)
  })

  it('pins Safes with an emergency to the top and keeps the rest in order', () => {
    expect(pinEmergencies(['treasury-ethereum', 'grants-base', 'security-ethereum'], items)).toEqual([
      'security-ethereum',
      'treasury-ethereum',
      'grants-base',
    ])
  })
})

describe('fleet admin scenario', () => {
  const fleetItems = getScenario('fleet')
  const fleetAccounts = getScenarioAccounts('fleet')
  const count = (key: string) => getPulse(fleetItems, 'owner').find((pulse) => pulse.key === key)?.count

  it('has 20 Safes and 11 signers, with conflicts, untrusted and stale proposals', () => {
    expect(fleetAccounts).toHaveLength(20)
    expect(new Set(fleetAccounts.flatMap((account) => account.owners)).size).toBe(11)
    expect(fleetItems.every((tx) => fleetAccounts.some((account) => account.id === tx.account))).toBe(true)
    expect(new Set(fleetItems.map((tx) => tx.id)).size).toBe(fleetItems.length)
    expect(count('conflicting')).toBeGreaterThanOrEqual(4)
    expect(count('untrusted')).toBe(3)
    expect(count('stale')).toBe(5)
  })

  it.each(['owner', 'single', 'security', 'member', 'admin'] as const)(
    'puts five busy Safes at the top for %s',
    (persona) => {
      const order = pinEmergencies(
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
