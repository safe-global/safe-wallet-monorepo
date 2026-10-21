import { getMenuActions, getPrimaryAction, getRemindable } from './actions'
import { getScenario } from './model'
import { getNotSignerNote, getSignatureSummary } from './signers'

const items = getScenario('everyday')
const proposal = (id: string) => items.find((tx) => tx.id === id)!

describe('next steps actions for a waiting row', () => {
  it('offers Remind to a workspace member who is not a signer', () => {
    expect(getPrimaryAction(proposal('grants-8'), items, 'owner', [], 'row')).toMatchObject({
      kind: 'remind',
      label: 'Remind',
    })
  })

  it('shows Reminded after a reminder was sent', () => {
    expect(getPrimaryAction(proposal('grants-8'), items, 'owner', ['grants-8'], 'row').label).toBe('Reminded')
  })

  it.each(['member', 'admin', 'single'] as const)('offers Remind to %s too', (persona) => {
    expect(getPrimaryAction(proposal('grants-8'), items, persona, [], 'row').kind).toBe('remind')
  })
})

describe('signers outside the workspace', () => {
  it('leaves them out of the reminder', () => {
    expect(getRemindable(proposal('grants-8'), 'member')).not.toContain('0x65F8…C7B0')
  })

  it('offers Invite to admins only', () => {
    const tx = proposal('grants-8')
    const primary = getPrimaryAction(tx, items, 'admin')
    expect(getMenuActions(tx, items, 'admin', primary)).toContain('invite')
    expect(getMenuActions(tx, items, 'member', getPrimaryAction(tx, items, 'member'))).not.toContain('invite')
  })
})

describe('security lead', () => {
  it('signs the last signature on Treasury and reminds on Grants, which they already signed', () => {
    expect(getPrimaryAction(proposal('treasury-42'), items, 'security')).toMatchObject({
      kind: 'flow',
      flow: 'signAndExecute',
    })
    expect(getPrimaryAction(proposal('grants-8'), items, 'security', [], 'row').kind).toBe('remind')
  })
})

describe('signer on one Safe', () => {
  it('signs only in the Safe they own', () => {
    expect(getPrimaryAction(proposal('payroll-18'), items, 'single').kind).toBe('flow')
    expect(getPrimaryAction(proposal('treasury-42'), items, 'single').kind).not.toBe('flow')
  })
})

describe('signature summary', () => {
  it('uses the gauge numbers and counts who can still sign', () => {
    expect(getSignatureSummary(proposal('grants-8'))).toBe('1 of 2 signed · 1 more from 4 signers')
  })

  it('explains when you are not a signer', () => {
    expect(getNotSignerNote(proposal('grants-8'), 'owner')).toBe("You aren't a signer of Grants.")
    expect(getNotSignerNote(proposal('treasury-42'), 'owner')).toBeUndefined()
  })
})
