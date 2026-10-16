import {
  generateBatchActions,
  getAmountLabel,
  getTypeLabel,
  getWarnings,
  getSignerSummary,
  getExecutionReason,
  getCreatedAt,
  getCounterparty,
  getTransactionLabel,
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
    const batch = items.find((tx) => tx.id === 'treasury-42-batch')!.kind
    expect(batch.type === 'batch' && batch.actions).toHaveLength(46)
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
    expect(getStatusLabel(proposal('treasury-44'), 'owner')).toBe('Blocked by #42')
    expect([getRowAction(proposal('grants-8'), 'owner'), getStatusLabel(proposal('grants-8'), 'owner')]).toEqual([
      'Review',
      'Waiting on others',
    ])
  })
  it('labels transactions by type and counterparty instead of a free-text title', () => {
    const heavy = (id: string) => getScenario('conflict-heavy').find((tx) => tx.id === id)!
    const swap = getScenario('conflict').find((tx) => tx.id === 'treasury-42-swap')!
    expect([getTransactionLabel(proposal('treasury-42')), getAmountLabel(proposal('treasury-42'))]).toEqual([
      'Send to Bitwave Payroll',
      '48.5 ETH · $155,200',
    ])
    expect(getTransactionLabel(proposal('treasury-42'), true)).toBe('Sent to Bitwave Payroll')
    expect([getTransactionLabel(proposal('payroll-17')), getAmountLabel(proposal('payroll-17'))]).toEqual([
      'Batch · 14 actions',
      '14 actions · 32,400 USDC',
    ])
    expect(getAmountLabel(heavy('treasury-42-batch'))).toBe('46 actions')
    expect([getTransactionLabel(proposal('treasury-43')), getAmountLabel(proposal('treasury-43'))]).toEqual([
      'Add signer Priya',
      'New signer: Priya',
    ])
    expect(getTransactionLabel(heavy('treasury-42-threshold'))).toBe('Change threshold to 2')
    expect([getTransactionLabel(swap), getAmountLabel(swap)]).toEqual(['Swap USDC → ETH', '200,000 USDC → 62.4 ETH'])
    expect(getTransactionLabel({ ...proposal('treasury-42'), kind: { type: 'rejection' } })).toBe('On-chain rejection')
  })
  it('labels settings changes as updates with the specific change', () => {
    expect([getTypeLabel(proposal('treasury-43')), getAmountLabel(proposal('treasury-43'))]).toEqual([
      'Update',
      'New signer: Priya',
    ])
    const threshold = getScenario('conflict-heavy').find((tx) => tx.id === 'treasury-42-threshold')!
    expect([getTypeLabel(threshold), getAmountLabel(threshold)]).toEqual(['Update', 'Threshold 3 → 2'])
  })
  describe('realistic scenario', () => {
    const real = (id: string) => getScenario('realistic').find((tx) => tx.id === id)!
    it.each([
      ['treasury-45', 'Bridge', 'Bridge ETH to Unknown network', '0.04 ETH → Unknown network', ['unknownNetwork']],
      ['treasury-46', 'Contract', 'Call execute on Uniswap Universal Router', 'execute · Uniswap Universal Router', []],
      ['treasury-48', 'Update', 'Enable module Zodiac Roles', 'Enable module: Zodiac Roles', ['policyChange']],
      ['payroll-19', 'Batch', 'Batch · 2 actions', '2 actions', []],
      ['payroll-20', 'Nested', 'Approve #44 on Treasury Main', 'Approves #44 on Treasury Main', []],
      ['grants-9', 'Swap', 'Swap ARB → USDC', '10,000 ARB → 7,950 USDC · Limit', ['expired']],
      ['grants-10', 'Send', 'Send to this Safe', '0.1 ETH · $320 · to this Safe', ['toSelf']],
    ])('labels %s as %s', (id, type, label, line, warnings) => {
      const tx = real(id)
      expect([getTypeLabel(tx), getTransactionLabel(tx), getAmountLabel(tx), getWarnings(tx)]).toEqual([
        type,
        label,
        line,
        warnings,
      ])
    })
    it('keeps the everyday queue and adds competing sends and an unsigned proposal', () => {
      const items = getScenario('realistic')
      expect(items.length).toBe(getScenario('everyday').length + 10)
      expect(getConflicts(real('treasury-47'), items).map((tx) => tx.id)).toEqual(['treasury-47-alt'])
      expect(real('grants-11')).toMatchObject({ signers: [], proposedBy: expect.stringContaining('Proposer') })
    })
    it('warns only on a delegate call to an untrusted target', () => {
      const tx = real('payroll-19')
      expect(getWarnings({ ...tx, kind: { ...tx.kind, delegateCall: 'untrusted' } as typeof tx.kind })).toEqual([
        'delegateCall',
      ])
    })
    it('flags an unverified contract', () => {
      const tx = real('treasury-46')
      expect(getWarnings({ ...tx, kind: { ...tx.kind, verified: false } as typeof tx.kind })).toEqual([
        'unverifiedContract',
      ])
    })
  })
  it('names who still needs to sign', () => {
    expect(getSignerSummary(proposal('treasury-44'), 'owner')).toBe('2 more from you, Max, Jonas, Lena')
    expect(getSignerSummary(proposal('treasury-44'), 'observer')).toBe('2 more from Dev, Max, Jonas, Lena')
    expect(getSignerSummary(proposal('treasury-43'), 'owner')).toBe('Threshold met')
  })
  it('explains in plain language whether a transaction can execute', () => {
    const items = getScenario('everyday')
    expect(getExecutionReason(proposal('treasury-44'), 'owner', items)).toBe(
      'Blocked by #42. Earlier transactions must execute first. You can still sign now.',
    )
    expect(getExecutionReason(proposal('treasury-42'), 'owner', items)).toBe(
      'Needs 1 more signature, including yours. It can execute once the threshold is reached.',
    )
    expect(getExecutionReason(proposal('grants-8'), 'owner', items)).toBe(
      'Needs 1 more signature from other signers before it can execute.',
    )
    const conflict = getScenario('conflict-heavy')
    expect(
      getExecutionReason(
        conflict.find((tx) => tx.id === 'treasury-42')!,
        'owner',
        conflict,
      ),
    ).toBe('All signatures are in and #42 is next, so it can execute now. Executing it cancels 3 competing proposals.')
  })
  it('derives a full timestamp from the fixture age', () => {
    const now = Date.UTC(2026, 9, 14, 12)
    expect(getCreatedAt(proposal('treasury-42'), now)).toBe(now - 3 * 86_400_000)
    expect(getCreatedAt(proposal('payroll-17'), now)).toBe(now - 5 * 3_600_000)
    expect(getCreatedAt({ ...proposal('payroll-17'), age: 'Just now' }, now)).toBe(now)
  })
  it('names the counterparty only for types that have one', () => {
    const real = (id: string) => getScenario('realistic').find((tx) => tx.id === id)!
    expect(getCounterparty(proposal('treasury-42'))).toEqual({ label: 'To', value: 'Bitwave Payroll' })
    expect(getCounterparty(real('grants-10'))).toEqual({ label: 'To', value: 'This Safe account' })
    expect(getCounterparty(real('treasury-46'))).toEqual({ label: 'Contract', value: 'Uniswap Universal Router' })
    expect(getCounterparty(real('payroll-19'))).toEqual({ label: 'Contract', value: 'MultiSendCallOnly' })
    expect(getCounterparty(real('treasury-45'))).toEqual({ label: 'To', value: 'Unknown network' })
    expect(getCounterparty(real('payroll-20'))).toEqual({ label: 'Parent Safe', value: 'Treasury Main' })
    expect(getCounterparty(real('grants-9'))).toBeUndefined()
    expect(getCounterparty(proposal('treasury-43'))).toBeUndefined()
  })
})
