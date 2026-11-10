import { accounts } from './model'
import type { Proposal } from '../types'
import { DEFAULT_DISPLAY, groupQueue, loadDisplay, orderQueue, saveDisplay } from './order'

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
const order = (items: Proposal[], sort: 'nonce' | 'oldest') =>
  ids(orderQueue(items, { sort, accounts: [treasury, payroll, grants] }))

describe('orderQueue', () => {
  it('sorts oldest first', () => {
    const items = [tx('treasury', 42, [], '1h ago'), tx('payroll', 17, [], '3d ago')]
    expect(order(items, 'oldest')).toEqual(['payroll-17', 'treasury-42'])
  })

  it('sorts by nonce within each Safe, Safes in workspace order', () => {
    const items = [tx('payroll', 18, [], '1m ago'), tx('treasury', 43, [], '1m ago'), tx('payroll', 17, [], '1m ago')]
    expect(order(items, 'nonce')).toEqual(['treasury-43', 'payroll-17', 'payroll-18'])
  })

  it('keeps options at one nonce together', () => {
    const items = [
      tx('treasury', 42, [], '1h ago', { id: 'a' }),
      tx('payroll', 17, [], '2h ago'),
      tx('treasury', 42, [], '5d ago', { id: 'b' }),
    ]
    for (const sort of ['nonce', 'oldest'] as const) {
      const result = order(items, sort)
      expect(Math.abs(result.indexOf('treasury-42a') - result.indexOf('treasury-42b'))).toBe(1)
    }
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

  it('defaults to grouping by status', () => {
    expect(loadDisplay()).toEqual({ groupBy: 'status' })
    expect(DEFAULT_DISPLAY).toEqual({ groupBy: 'status' })
  })

  it('remembers the last grouping', () => {
    saveDisplay({ groupBy: 'network' })
    expect(loadDisplay()).toEqual({ groupBy: 'network' })
  })

  it('ignores a saved value it does not know', () => {
    localStorage.setItem('prototype.pendingQueue.display', '{"groupBy":"color"}')
    expect(loadDisplay()).toEqual(DEFAULT_DISPLAY)
  })
})
