import { getScenario, getScenarioAccounts, getState } from './model'
import {
  applyPreviewAction,
  BULK_EXECUTE_LIMIT,
  createPreviewQueue,
  executePreviewBatches,
  getFirstReady,
  getBulkExecutable,
  proposePreviewAlternative,
} from './queue'
import type { Proposal } from '../types'

describe('preview queue actions', () => {
  it('requires permission, rejects duplicate signatures, and allows blocked proposals to be signed only', () => {
    const queue = createPreviewQueue('everyday')
    expect(applyPreviewAction(queue, 'treasury-44', 'member', 'sign')).toBe(queue)
    expect(applyPreviewAction(queue, 'grants-8', 'owner', 'sign')).toBe(queue)
    expect(applyPreviewAction(queue, 'treasury-43', 'owner', 'execute')).toBe(queue)
    const signed = applyPreviewAction(queue, 'treasury-44', 'owner', 'sign')
    expect(signed.items.find((tx) => tx.id === 'treasury-44')?.signers).toEqual(['Ana', 'Dev'])
    expect(signed.nextNonces).toEqual(queue.nextNonces)
    expect(applyPreviewAction(signed, 'treasury-44', 'owner', 'sign')).toBe(signed)
    expect(applyPreviewAction(signed, 'treasury-44', 'owner', 'execute')).toBe(signed)
  })
  it('atomically signs and executes, invalidates only same-Safe same-nonce competitors, and preserves notes', () => {
    const queue = createPreviewQueue('conflict')
    const original = queue.items.find((tx) => tx.id === 'treasury-42')!
    const updated = applyPreviewAction(queue, original.id, 'owner', 'signAndExecute')
    expect(updated.completed[0]).toMatchObject({ id: original.id, signers: ['Ana', 'Max', 'Dev'], note: original.note })
    expect(updated.items.some((tx) => tx.account === 'treasury' && tx.nonce === 42)).toBe(false)
    expect(updated.items.find((tx) => tx.id === 'payroll-17')).toEqual(queue.items.find((tx) => tx.id === 'payroll-17'))
    expect(updated.nextNonces.treasury).toBe(43)
    expect(getState(updated.items.find((tx) => tx.id === 'treasury-43')!).ready).toBe(true)
    expect(applyPreviewAction(updated, original.id, 'owner', 'signAndExecute')).toBe(updated)
    expect(queue.items.find((tx) => tx.id === original.id)?.signers).toEqual(['Ana', 'Max'])
  })
  it('proposes cancellation without advancing nonce, removing the original, or copying its note', () => {
    const queue = createPreviewQueue('everyday')
    const result = proposePreviewAlternative(queue, 'treasury-42', 'owner', 'cancellation')
    expect(result.proposal).toMatchObject({ nonce: 42, kind: { type: 'rejection' }, signers: ['Dev'], amount: '0 ETH' })
    expect(result.proposal?.note).toBeUndefined()
    expect(result.queue.items).toHaveLength(queue.items.length + 1)
    expect(result.queue.items.find((tx) => tx.id === 'treasury-42')).toEqual(
      queue.items.find((tx) => tx.id === 'treasury-42'),
    )
    expect(result.queue.nextNonces).toEqual(queue.nextNonces)
  })
  it('validates replacement fields and denies observers and non-owners alternative proposals', () => {
    const queue = createPreviewQueue('everyday')
    expect(proposePreviewAlternative(queue, 'treasury-42', 'member', 'cancellation').queue).toBe(queue)
    expect(proposePreviewAlternative(queue, 'grants-8', 'owner', 'cancellation').queue).toBe(queue)
    expect(
      proposePreviewAlternative(queue, 'treasury-42', 'owner', 'replacement', {
        recipient: ' ',
        amount: '1 ETH',
      }).queue,
    ).toBe(queue)
    const result = proposePreviewAlternative(queue, 'treasury-42', 'owner', 'replacement', {
      recipient: ' Payee',
      amount: '1 ETH ',
    })
    expect(result.proposal).toMatchObject({
      recipient: 'Payee',
      amount: '1 ETH',
      origin: 'replacement',
      kind: { type: 'transfer' },
    })
    expect(result.proposal?.note).toBeUndefined()
  })
  it('allows a final signature without forcing execution', () => {
    const queue = createPreviewQueue('everyday')
    const updated = applyPreviewAction(queue, 'treasury-42', 'owner', 'sign')
    expect(updated.completed).toHaveLength(0)
    expect(updated.nextNonces.treasury).toBe(42)
    expect(getState(updated.items.find((tx) => tx.id === 'treasury-42')!).ready).toBe(true)
  })
  it('bulk executes only fully signed, consecutive, single-proposal nonces per Safe', () => {
    const batches = getBulkExecutable(createPreviewQueue('conflict-heavy').items)
    const payroll = batches.find((batch) => batch.account.id === 'payroll')!
    expect(payroll.proposals.map((tx) => tx.nonce)).toEqual([17, 18])
    const treasury = batches.find((batch) => batch.account.id === 'treasury')!
    expect(treasury.proposals).toHaveLength(0)
    expect(treasury.blocked).toEqual({ nonce: 42, competing: 4 })
    expect(batches.some((batch) => batch.account.id === 'grants')).toBe(false)
  })
  it('stops at the first unsigned nonce and offers nothing when the next nonce is unsigned', () => {
    const batches = getBulkExecutable(createPreviewQueue('everyday').items)
    expect(batches.map((batch) => [batch.account.id, batch.proposals.map((tx) => tx.nonce)])).toEqual([
      ['payroll', [17]],
    ])
  })
  it(`caps a Safe's batch at ${BULK_EXECUTE_LIMIT} transactions`, () => {
    const many: Proposal[] = Array.from({ length: 25 }, (_, index) => ({
      id: `payroll-bulk-${index}`,
      account: 'payroll',
      nonce: 17 + index,
      recipient: 'Vendor',
      amount: '1 USDC',
      kind: { type: 'transfer' },
      age: '1h ago',
      signers: ['Ana', 'Max'],
      eligible: true,
    }))
    expect(getBulkExecutable(many)[0].proposals).toHaveLength(BULK_EXECUTE_LIMIT)
  })
  it('executes each Safe batch in nonce order and records history', () => {
    const queue = createPreviewQueue('conflict-heavy')
    const next = executePreviewBatches(queue, getBulkExecutable(queue.items))
    expect(next.completed.map((tx) => tx.id)).toEqual(['payroll-17', 'payroll-18'])
    expect(next.nextNonces.payroll).toBe(19)
    expect(next.items.filter((tx) => tx.account === 'treasury' && tx.nonce === 42)).toHaveLength(4)
  })
})

describe('scenarios and states', () => {
  it.each(['20-safes', '50-safes'] as const)('has every transaction type in %s', (scenario) => {
    const items = getScenario(scenario)
    const types = new Set(items.map((tx) => tx.kind.type))
    for (const type of ['transfer', 'swap', 'bridge', 'batch', 'contract', 'settings', 'nested', 'rejection'])
      expect(types).toContain(type)
    expect(items.some((tx) => tx.app)).toBe(true)
    expect(items.some((tx) => tx.kind.type === 'contract' && !tx.kind.verified)).toBe(true)
    const threeWay = items.filter(
      (tx) => tx.id.includes('-mix-') && tx.nonce === items.find((t) => t.id.endsWith('-mix-a'))?.nonce,
    )
    expect(threeWay.filter((tx) => tx.account === threeWay[0].account)).toHaveLength(3)
  })

  it('has as many Safes as its name says', () => {
    expect(getScenarioAccounts('1-safe')).toHaveLength(1)
    expect(getScenarioAccounts('5-safes')).toHaveLength(5)
    expect(getScenarioAccounts('10-safes')).toHaveLength(10)
    expect(getScenarioAccounts('20-safes')).toHaveLength(20)
    expect(getScenarioAccounts('50-safes')).toHaveLength(50)
  })

  it('layers states on any scenario', () => {
    expect(createPreviewQueue('20-safes', 'empty').items).toEqual([])
    const lastSafe = getScenarioAccounts('20-safes').at(-1)!.id
    expect(createPreviewQueue('20-safes', 'partial').items.some((tx) => tx.account === lastSafe)).toBe(false)
    const running = getFirstReady(getScenario('20-safes'))!
    const executing = createPreviewQueue('20-safes', 'executing').items
    expect(
      executing.filter((tx) => tx.account === running.account && tx.nonce === running.nonce).length,
    ).toBeGreaterThan(1)
  })
})
