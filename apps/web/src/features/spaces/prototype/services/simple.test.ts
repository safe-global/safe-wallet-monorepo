import { accounts } from './model'
import type { Proposal } from '../types'
import { formatUpdated, getNeedsYou, getSafeBadges } from './simple'

// Dev ("owner") signs on Treasury (3 of 5, next #42) and Ops Payroll (2 of 4, next #17), not on Grants.
const [treasury] = accounts
const tx = (account: string, nonce: number, signers: string[], age: string, id = `${account}-${nonce}`): Proposal => ({
  id,
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

describe('needs you', () => {
  it('lists rows you can act on now, execute before sign, then oldest first', () => {
    const items = [
      tx('treasury', 42, ['Ana'], '1h ago'),
      tx('payroll', 17, ['Ana', 'Max'], '5m ago'),
      tx('treasury', 43, ['Ana'], '3d ago'),
      tx('grants', 12, ['Ana'], '2d ago'),
    ]
    // Payroll #17 is ready to execute. Treasury #43 can be signed ahead, after #42 that executes first.
    expect(ids(getNeedsYou(items, 'owner'))).toEqual(['payroll-17', 'treasury-42', 'treasury-43'])
  })

  it('keeps a conflict group together, even the option you cannot act on', () => {
    const items = [
      tx('treasury', 42, ['Ana'], '1h ago', 'send'),
      tx('treasury', 42, ['Ana', 'Dev'], '2h ago', 'reject'),
      tx('payroll', 17, [], '5m ago'),
    ]
    expect(ids(getNeedsYou(items, 'owner'))).toEqual(['send', 'reject', 'payroll-17'])
  })

  it("keeps a Safe's rows in nonce order", () => {
    // #44 waits longer, but #43 executes first.
    const items = [tx('treasury', 43, ['Ana'], '1h ago'), tx('treasury', 44, ['Ana'], '3d ago')]
    expect(ids(getNeedsYou(items, 'owner'))).toEqual(['treasury-43', 'treasury-44'])
  })

  it('is empty for someone who signs nothing', () => {
    expect(getNeedsYou([tx('grants', 12, ['Ana'], '2d ago')], 'owner')).toEqual([])
  })
})

describe('Safe band', () => {
  it('flags a conflict and counts rows blocked behind the next nonce', () => {
    const items = [
      tx('treasury', 42, ['Ana'], '1h ago', 'a'),
      tx('treasury', 42, ['Max'], '1h ago', 'b'),
      tx('treasury', 43, ['Ana'], '1h ago'),
      tx('treasury', 44, ['Ana'], '1h ago'),
    ]
    expect(getSafeBadges(treasury, items, 'owner')).toEqual({ conflict: true, blocked: 2 })
    expect(getSafeBadges(treasury, [items[2]], 'owner')).toEqual({ conflict: false, blocked: 1 })
  })
})

describe('freshness', () => {
  it('says how long ago the queue was fetched', () => {
    expect(formatUpdated(0, 4_000)).toBe('Updated just now')
    expect(formatUpdated(0, 42_000)).toBe('Updated 40s ago')
    expect(formatUpdated(0, 185_000)).toBe('Updated 3m ago')
  })
})
