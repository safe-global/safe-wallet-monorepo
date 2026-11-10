import { accounts } from './model'
import type { Proposal } from '../types'
import {
  DEFAULT_DISPLAY,
  getColumnSort,
  groupQueue,
  loadDisplay,
  orderQueue,
  saveDisplay,
  sortByColumn,
  type SortBy,
} from './order'

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
const order = (items: Proposal[], sort: SortBy) =>
  ids(orderQueue(items, { sort, accounts: [treasury, payroll, grants] }))

describe('orderQueue', () => {
  it('sorts oldest or newest first', () => {
    const items = [tx('treasury', 42, [], '1h ago'), tx('payroll', 17, [], '3d ago')]
    expect(order(items, 'oldest')).toEqual(['payroll-17', 'treasury-42'])
    expect(order(items, 'newest')).toEqual(['treasury-42', 'payroll-17'])
  })

  it('sorts by nonce within each Safe, Safes in workspace order', () => {
    const items = [tx('payroll', 18, [], '1m ago'), tx('treasury', 43, [], '1m ago'), tx('payroll', 17, [], '1m ago')]
    expect(order(items, 'nonce')).toEqual(['treasury-43', 'payroll-17', 'payroll-18'])
  })

  it('sorts by value either way', () => {
    const items = [tx('treasury', 42, [], '1h ago', { amount: '10 USDC' }), tx('payroll', 17, [], '1h ago')]
    expect(order(items, 'valueDesc')).toEqual(['payroll-17', 'treasury-42'])
    expect(order(items, 'valueAsc')).toEqual(['treasury-42', 'payroll-17'])
  })

  it('keeps options at one nonce together, whatever the sort', () => {
    const items = [
      tx('treasury', 42, [], '1h ago', { id: 'a' }),
      tx('payroll', 17, [], '2h ago'),
      tx('treasury', 42, [], '5d ago', { id: 'b' }),
    ]
    for (const sort of ['nonce', 'oldest', 'newest', 'valueDesc', 'valueAsc', 'safeAsc', 'safeDesc'] as const) {
      const result = order(items, sort)
      expect(Math.abs(result.indexOf('treasury-42a') - result.indexOf('treasury-42b'))).toBe(1)
    }
  })
})

describe('column headers', () => {
  it('flips Proposed between newest and oldest, and Safe between A to Z and Z to A', () => {
    expect(sortByColumn('nonce', 'Proposed')).toBe('newest')
    expect(sortByColumn('newest', 'Proposed')).toBe('oldest')
    expect(sortByColumn('safeAsc', 'Safe')).toBe('safeDesc')
  })

  it('keeps nonce lowest first', () => {
    expect(sortByColumn('nonce', 'Nonce')).toBe('nonce')
  })

  it('marks the header that matches the sort, and none for value', () => {
    expect(getColumnSort('oldest')).toEqual({ column: 'Proposed', direction: 'asc' })
    expect(getColumnSort('valueDesc')).toBeUndefined()
  })
})

describe('groupQueue', () => {
  it('groups by status in a fixed order and drops empty groups', () => {
    const rows = [
      tx('grants', 8, [], '1h ago'),
      tx('treasury', 42, [], '1h ago'),
      tx('payroll', 17, ['Ana', 'Max'], '1h ago'),
      tx('grants', 9, [], '1h ago'),
    ]
    const groups = groupQueue(rows, 'status', 'owner')
    expect(groups.map((group) => group.label)).toEqual([
      'Ready to execute',
      'Ready to sign',
      'Waiting on others',
      'Blocked',
    ])
    expect(groups.map((group) => ids(group.rows))).toEqual([
      ['payroll-17'],
      ['treasury-42'],
      ['grants-8'],
      ['grants-9'],
    ])
  })

  it('puts rows your signature executes in their own group, first', () => {
    const [group] = groupQueue(
      [tx('treasury', 42, ['Ana', 'Max'], '1h ago'), tx('payroll', 17, ['Ana', 'Max'], '1h ago')],
      'status',
      'owner',
    )
    expect(group.label).toBe('Sign and execute')
    expect(ids(group.rows)).toEqual(['treasury-42'])
  })

  it('puts a conflict group under its most urgent option', () => {
    const rows = [
      tx('payroll', 17, [], '1h ago', { id: 'a' }),
      tx('payroll', 17, ['Ana', 'Max'], '1h ago', { id: 'b' }),
    ]
    const [group] = groupQueue(rows, 'status', 'owner')
    expect(group.label).toBe('Ready to execute')
    expect(ids(group.rows)).toEqual(['payroll-17a', 'payroll-17b'])
  })

  it('groups by network in the order of each network’s first row', () => {
    const rows = [tx('payroll', 17, [], '1h ago'), tx('treasury', 42, [], '1h ago')]
    const groups = groupQueue(rows, 'network', 'owner')
    expect(groups.map((group) => group.label)).toEqual([payroll.network, treasury.network])
  })
})

describe('display preference', () => {
  beforeEach(() => localStorage.clear())

  it('defaults to grouping by status, oldest first', () => {
    expect(loadDisplay()).toEqual(DEFAULT_DISPLAY)
    expect(DEFAULT_DISPLAY).toEqual({ groupBy: 'status', sort: 'oldest' })
  })

  it('remembers the last choice', () => {
    saveDisplay({ groupBy: 'safe', sort: 'newest' })
    expect(loadDisplay()).toEqual({ groupBy: 'safe', sort: 'newest' })
  })

  it('ignores a saved value it does not know, including the old Display shape', () => {
    localStorage.setItem('prototype.pendingQueue.display', '{"order":{"by":"nonce"},"groupBy":"none"}')
    expect(loadDisplay()).toEqual(DEFAULT_DISPLAY)
  })
})
