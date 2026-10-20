import { getPrimaryAction } from './actions'
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

  it('offers no reminder to a view-only user', () => {
    expect(getPrimaryAction(proposal('grants-8'), items, 'observer', [], 'row').kind).toBe('review')
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
