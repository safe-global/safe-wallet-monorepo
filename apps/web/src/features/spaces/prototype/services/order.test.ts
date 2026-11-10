import { accounts } from './model'
import type { Proposal } from '../types'
import { DEFAULT_DISPLAY, groupQueue, loadDisplay, orderQueue, saveDisplay, sortByColumn } from './order'

// Dev ("owner") signs on Treasury (3 of 5, next #42) and Ops Payroll (2 of 4, next #17), not on Grants.
const [treasury, payroll, grants] = accounts
const tx = (
  account: string,
  nonce: number,
  signers: string[],
  age: string,
  { id: suffix = '', ...extra }: Partial<Proposal> = {},
): Proposal => ({
  id: `${account}-${nonce}${suffix}`,
  account,
  nonce,
  recipient: 'Contoso Ltd · 0x4f2a…c81e',
  amount: '100 USDC',
  kind: { type: 'transfer' },
  age,
  signers,
  eligible: true,
  ...extra,
})
const ids = (list: { id: string }[]) => list.map((item) => item.id)
const order = (items: Proposal[], by = DEFAULT_DISPLAY.order) =>
  ids(orderQueue(items, { order: by, persona: 'owner', accounts: [treasury, payroll, grants] }))

describe('orderQueue', () => {
  it('puts what you can execute first, then what you can sign, then what waits on others', () => {
    const items = [
      tx('grants', 8, [], '9d ago'),
      tx('treasury', 42, [], '1h ago'),
      tx('payroll', 17, ['Ana', 'Max'], '5m ago'),
    ]
    expect(order(items)).toEqual(['payroll-17', 'treasury-42', 'grants-8'])
  })

  it('breaks ties by the oldest proposal', () => {
    const items = [tx('treasury', 42, [], '1h ago'), tx('payroll', 17, [], '3d ago')]
    expect(order(items)).toEqual(['payroll-17', 'treasury-42'])
  })

  it('keeps options at one nonce together, whatever the order', () => {
    const items = [
      tx('treasury', 42, [], '1h ago', { id: 'a' }),
      tx('payroll', 17, [], '2h ago'),
      tx('treasury', 42, [], '5d ago', { id: 'b' }),
    ]
    for (const by of ['status', 'proposed', 'nonce', 'value', 'safe'] as const) {
      const result = order(items, { by, direction: 'asc' })
      const first = result.indexOf('treasury-42a')
      expect(Math.abs(first - result.indexOf('treasury-42b'))).toBe(1)
    }
  })

  it('orders by nonce within each Safe, Safes in workspace order', () => {
    const items = [tx('payroll', 18, [], '1m ago'), tx('treasury', 43, [], '1m ago'), tx('payroll', 17, [], '1m ago')]
    expect(order(items, { by: 'nonce', direction: 'asc' })).toEqual(['treasury-43', 'payroll-17', 'payroll-18'])
  })

  it('orders newest first by proposal date when descending', () => {
    const items = [tx('treasury', 42, [], '3d ago'), tx('payroll', 17, [], '1h ago')]
    expect(order(items, { by: 'proposed', direction: 'desc' })).toEqual(['payroll-17', 'treasury-42'])
  })

  it('orders by value, largest first when descending', () => {
    const items = [tx('treasury', 42, [], '1h ago', { amount: '10 USDC' }), tx('payroll', 17, [], '1h ago')]
    expect(order(items, { by: 'value', direction: 'desc' })).toEqual(['payroll-17', 'treasury-42'])
  })
})

describe('sortByColumn', () => {
  it('starts a new column in its natural direction and reverses on a second click', () => {
    const proposed = sortByColumn({ by: 'status', direction: 'asc' }, 'proposed')
    expect(proposed).toEqual({ by: 'proposed', direction: 'desc' })
    expect(sortByColumn(proposed, 'proposed')).toEqual({ by: 'proposed', direction: 'asc' })
  })
})

describe('groupQueue', () => {
  const rows = [tx('payroll', 17, [], '1h ago'), tx('treasury', 42, [], '1h ago'), tx('payroll', 18, [], '1h ago')]

  it('returns one group when not grouping', () => {
    expect(groupQueue(rows, 'none').map((group) => ids(group.rows))).toEqual([
      ['payroll-17', 'treasury-42', 'payroll-18'],
    ])
  })

  it('groups by Safe in the order of each Safe’s first row', () => {
    const groups = groupQueue(rows, 'safe')
    expect(groups.map((group) => group.label)).toEqual([
      payroll.safeName ?? payroll.name,
      treasury.safeName ?? treasury.name,
    ])
    expect(ids(groups[0].rows)).toEqual(['payroll-17', 'payroll-18'])
  })

  it('groups by network', () => {
    expect(groupQueue(rows, 'network').every((group) => group.chainId)).toBe(true)
  })
})

describe('display preference', () => {
  beforeEach(() => localStorage.clear())

  it('defaults to needs-you first with no grouping', () => {
    expect(loadDisplay()).toEqual(DEFAULT_DISPLAY)
  })

  it('remembers the last choice', () => {
    saveDisplay({ order: { by: 'nonce', direction: 'desc' }, groupBy: 'safe' })
    expect(loadDisplay()).toEqual({ order: { by: 'nonce', direction: 'desc' }, groupBy: 'safe' })
  })

  it('ignores a saved value it does not know', () => {
    localStorage.setItem('prototype.pendingQueue.display', '{"order":{"by":"market cap"},"groupBy":"color"}')
    expect(loadDisplay()).toEqual(DEFAULT_DISPLAY)
  })
})
