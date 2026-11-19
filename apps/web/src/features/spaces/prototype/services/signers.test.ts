import { getAccount, getScenario } from './model'
import { toSignatureRows } from './signers'

const items = getScenario('everyday')
const proposal = (id: string) => items.find((tx) => tx.id === id)!

describe('signature rows for the shared footer', () => {
  it('starts with the creator, then signed, then needed', () => {
    const kinds = toSignatureRows(proposal('grants-8'), 'owner').map((row) => row.kind)
    expect(kinds[0]).toBe('created')
    expect(kinds.lastIndexOf('signed')).toBeLessThan(kinds.indexOf('needed'))
  })

  it('has one row per owner after the creator', () => {
    const tx = proposal('grants-8')
    const rows = toSignatureRows(tx, 'owner')
    expect(rows.filter((row) => row.kind === 'signed')).toHaveLength(1)
    expect(rows.filter((row) => row.kind !== 'created')).toHaveLength(5)
  })

  it('marks your own row', () => {
    const rows = toSignatureRows(proposal('treasury-42'), 'owner')
    expect(rows.filter((row) => row.kind !== 'created' && row.you)).toHaveLength(1)
  })

  it('marks the signers left once the threshold is met as no longer needed', () => {
    const tx = items.find((item) => {
      const { threshold, owners } = getAccount(item)
      const signed = item.signers.filter((owner) => owners.includes(owner)).length
      return signed >= threshold && signed < owners.length
    })!
    const kinds = toSignatureRows(tx, 'owner').map((row) => row.kind)

    expect(kinds).toContain('not-needed')
    expect(kinds).not.toContain('needed')
  })
})
