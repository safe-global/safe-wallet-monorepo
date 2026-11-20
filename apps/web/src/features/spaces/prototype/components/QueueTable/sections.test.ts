import { accounts, fleetAccounts } from '../../services/model'
import type { Proposal } from '../../types'
import { buildSections, groupBySafe, rankAccounts } from './sections'

// Dev ("owner") signs on Treasury (3 of 5, next #42) and Ops Payroll (2 of 4, next #17), not on Grants.
const [treasury, payroll, grants] = accounts
const tx = (account: string, nonce: number, signers: string[], age: string): Proposal => ({
  id: `${account}-${nonce}`,
  account,
  nonce,
  recipient: 'Contoso Ltd · 0x4f2a…c81e',
  amount: '100 USDC',
  kind: { type: 'transfer' },
  age,
  signers,
  eligible: true,
})
const ids = (list: { id: string }[]) => list.map((item) => item.id)

describe('Safe order', () => {
  it('puts the most urgent step first, whatever its age', () => {
    const items = [tx('payroll', 17, ['Ana', 'Max'], '5d ago'), tx('treasury', 42, ['Ana', 'Max'], '1m ago')]
    // Treasury needs the last signature and execution; Ops Payroll only needs execution.
    expect(ids(rankAccounts([payroll, treasury], items, 'owner'))).toEqual(['treasury', 'payroll'])
  })

  it('breaks ties by the transaction waiting longest', () => {
    const items = [tx('treasury', 42, ['Ana'], '1h ago'), tx('payroll', 17, [], '3d ago')]
    expect(ids(rankAccounts([treasury, payroll], items, 'owner'))).toEqual(['payroll', 'treasury'])
  })

  it('keeps the workspace order for Safes with nothing to act on', () => {
    const items = [tx('grants', 8, [], '9d ago'), tx('payroll', 17, [], '1h ago')]
    expect(ids(rankAccounts([grants, treasury, payroll], items, 'owner'))).toEqual(['payroll', 'grants', 'treasury'])
  })

  it('follows a fixed order when one is given', () => {
    const items = [tx('treasury', 42, ['Ana', 'Max'], '1m ago'), tx('payroll', 17, [], '1h ago')]
    const sections = buildSections({
      visible: items,
      accounts,
      accountFilter: [],
      persona: 'owner',
      order: ['grants', 'payroll', 'treasury'],
    })
    expect(sections.map((section) => section.account?.id)).toEqual(['grants', 'payroll', 'treasury'])
  })
})

describe('Safes on several networks', () => {
  const fleet = (id: string) => fleetAccounts.find((account) => account.id === `fleet-${id}`)!

  it('shares one address across a Safe’s networks', () => {
    expect(fleet('treasury-ethereum').iconAddress).toBe(fleet('treasury-base').iconAddress)
    expect(fleet('treasury-ethereum').iconAddress).not.toBe(fleet('liquidity-ethereum').iconAddress)
  })

  it('groups networks under their Safe, where its first network ranks', () => {
    const sections = buildSections({
      visible: [],
      accounts: [fleet('treasury-ethereum'), fleet('vesting-ethereum'), fleet('treasury-base')],
      accountFilter: [],
      persona: 'owner',
      order: ['fleet-treasury-ethereum', 'fleet-vesting-ethereum', 'fleet-treasury-base'],
    })
    const groups = groupBySafe(sections)
    expect(groups.map((group) => group.label)).toEqual(['Treasury', 'Vesting'])
    expect(groups[0].sections.map((section) => section.account.network)).toEqual(['Ethereum', 'Base'])
  })

  it('keeps nonces per network', () => {
    const sections = buildSections({
      visible: [tx('fleet-treasury-ethereum', 1, [], '1h ago'), tx('fleet-treasury-base', 1, [], '1h ago')],
      accounts: [fleet('treasury-ethereum'), fleet('treasury-base')],
      accountFilter: [],
      persona: 'owner',
    })
    expect(groupBySafe(sections)[0].sections.map((section) => section.items.length)).toEqual([1, 1])
  })
})
