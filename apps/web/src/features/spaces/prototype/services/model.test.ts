import {
  generateBatchActions,
  getRowAction,
  getStatusLabel,
  getAction,
  getOutstandingSigners,
  getConflicts,
  getScenario,
  getState,
  getPrimaryStatus,
  matchesFilter,
} from './model'

const proposal = (id: string) => getScenario('everyday').find((tx) => tx.id === id)!

describe('prototype queue state', () => {
  it('allows non-owners to review execution only after threshold is met at the current nonce', () => {
    expect(getAction(proposal('payroll-17'), 'observer')).toBe('Review and execute')
    expect(getAction(proposal('treasury-42'), 'observer')).toBe('View details')
    expect(getAction(proposal('treasury-43'), 'observer')).toBe('View earlier transactions')
  })
  it('allows a final signature and execution at the current nonce', () => {
    expect(getAction(proposal('treasury-42'), 'owner')).toBe('Review, sign and execute')
  })
  it('keeps signature and dependency filters overlapping', () => {
    const tx = proposal('treasury-44')
    expect(matchesFilter(tx, 'sign', 'owner')).toBe(true)
    expect(matchesFilter(tx, 'waiting', 'owner')).toBe(true)
  })
  it('assigns actionable status first while preserving secondary waiting filters', () => {
    expect(getPrimaryStatus(proposal('payroll-17'), 'owner')).toBe('ready')
    expect(getPrimaryStatus(proposal('treasury-42'), 'owner')).toBe('sign')
    expect(getPrimaryStatus(proposal('treasury-44'), 'owner')).toBe('sign')
    expect(getPrimaryStatus(proposal('treasury-43'), 'owner')).toBe('waiting')
    expect(getPrimaryStatus(proposal('grants-8'), 'owner')).toBe('awaiting')
    expect(matchesFilter(proposal('grants-8'), 'awaiting', 'owner')).toBe(true)
    expect(getPrimaryStatus(proposal('treasury-44'), 'observer')).toBe('waiting')
    expect(getPrimaryStatus(proposal('treasury-42'), 'observer')).toBe('awaiting')
  })
  it('does not offer execution or signing for a consumed nonce', () => {
    expect(getState({ ...proposal('payroll-17'), nonce: 16 })).toMatchObject({ ready: false, canSign: false })
  })
  it('finds conflicts within a Safe and nonce before presentation filtering', () => {
    const all = getScenario('conflict')
    expect(getConflicts(proposal('treasury-42'), all).map((tx) => tx.id)).toEqual(['treasury-42-swap'])
    expect(getConflicts(proposal('payroll-17'), all)).toEqual([])
  })
  it('counts only current-owner confirmations and lists outstanding owners', () => {
    const tx = { ...proposal('treasury-42'), signers: ['Ana', 'Former owner'] }
    expect(getState(tx)).toMatchObject({ missing: 2, ready: false, finalSignature: false })
    expect(getOutstandingSigners(tx)).toEqual(['Dev', 'Max', 'Jonas', 'Lena'])
  })
  it('requires eligibility and current ownership to offer a signature', () => {
    expect(getState({ ...proposal('treasury-42'), eligible: false }).canSign).toBe(false)
    expect(getState({ ...proposal('grants-8'), eligible: true }).canSign).toBe(false)
    expect(getState(proposal('treasury-42'), 'observer').canSign).toBe(false)
  })
  it('generates numbered batch actions and seeds a four-way conflict with a 46-action batch', () => {
    const actions = generateBatchActions(46)
    expect(actions).toHaveLength(46)
    expect(actions[0]).toEqual({ method: 'transfer', to: 'Supplier 1 · 0x0001…0001', value: '250 USDC' })
    expect(actions[4].method).toBe('approve')
    const items = getScenario('conflict-heavy')
    const treasury42 = items.filter((tx) => tx.account === 'treasury' && tx.nonce === 42)
    expect(treasury42).toHaveLength(4)
    expect(treasury42.every((tx) => getState(tx).missing === 0)).toBe(true)
    expect(items.find((tx) => tx.id === 'treasury-42-batch')?.actions).toHaveLength(46)
  })
  it('labels the row action and status from one source', () => {
    expect([getRowAction(proposal('payroll-17'), 'owner'), getStatusLabel(proposal('payroll-17'), 'owner')]).toEqual([
      'Execute',
      'Ready to execute',
    ])
    expect([getRowAction(proposal('treasury-42'), 'owner'), getStatusLabel(proposal('treasury-42'), 'owner')]).toEqual([
      'Sign',
      'Ready to sign',
    ])
    expect(getStatusLabel(proposal('treasury-44'), 'owner')).toBe('Waiting on #42')
    expect([getRowAction(proposal('grants-8'), 'owner'), getStatusLabel(proposal('grants-8'), 'owner')]).toEqual([
      'Review',
      'Waiting on signatures',
    ])
  })
})
