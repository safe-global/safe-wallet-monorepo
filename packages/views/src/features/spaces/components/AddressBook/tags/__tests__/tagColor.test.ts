import { TAG_PALETTE, tagColor, tagColorIndex } from '../tagColor'

describe('tagColor', () => {
  it('is deterministic and case-insensitive', () => {
    expect(tagColorIndex('Vendor')).toBe(tagColorIndex('vendor'))
    expect(tagColorIndex(' Vendor ')).toBe(tagColorIndex('Vendor'))
    expect(tagColor('Vendor')).toBe(tagColor('Vendor'))
  })

  it('always lands in the eight-colour palette', () => {
    const tags = ['Internal', 'Vendor', 'Payroll', 'Investor', 'Exchange', 'Auditor', 'Legal', 'Grants', 'DeFi', 'Ops']
    for (const tag of tags) {
      const index = tagColorIndex(tag)
      expect(index).toBeGreaterThanOrEqual(0)
      expect(index).toBeLessThan(TAG_PALETTE.length)
    }
    expect(TAG_PALETTE).toHaveLength(8)
  })

  it('spreads different tags over more than one colour', () => {
    const indexes = new Set(['Internal', 'Vendor', 'Payroll', 'Investor', 'Exchange', 'Auditor'].map(tagColorIndex))
    expect(indexes.size).toBeGreaterThan(1)
  })
})
