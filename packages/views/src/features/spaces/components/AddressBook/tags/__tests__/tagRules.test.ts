import { commonTags, dedupeTags, hasTag, validateTag, withoutTags, TAG_MAX_LENGTH } from '../tagRules'

describe('validateTag', () => {
  it('accepts letters, numbers, spaces and - _ & /', () => {
    expect(validateTag('Treasury ops 2026')).toBeUndefined()
    expect(validateTag('R&D / infra_core-1')).toBeUndefined()
    expect(validateTag('Zürich Büro')).toBeUndefined()
  })

  it('rejects an empty or whitespace-only tag', () => {
    expect(validateTag('')).toBe('Tags cannot be empty')
    expect(validateTag('   ')).toBe('Tags cannot be empty')
  })

  it.each(['=SUM(1)', '+1', '-1', '@cmd'])('rejects the formula prefix in %s', (tag) => {
    expect(validateTag(tag)).toBe('Tags cannot start with =, +, - or @')
  })

  it.each(['a.b', 'a#b', '<b>', "it's", '🚀'])('rejects the disallowed character in %s', (tag) => {
    expect(validateTag(tag)).toMatch(/can only contain/)
  })

  it('allows a dash inside the tag', () => {
    expect(validateTag('pre-sale')).toBeUndefined()
  })

  it('counts codepoints for the length limit', () => {
    expect(validateTag('é'.repeat(TAG_MAX_LENGTH))).toBeUndefined()
    expect(validateTag('é'.repeat(TAG_MAX_LENGTH + 1))).toBe(`Tags must be at most ${TAG_MAX_LENGTH} characters long`)
  })
})

describe('dedupeTags', () => {
  it('dedupes case-insensitively, keeps the first spelling and trims', () => {
    expect(dedupeTags(['Vendor', ' vendor', 'VENDOR ', 'Payroll'])).toEqual(['Vendor', 'Payroll'])
  })

  it('drops empty entries', () => {
    expect(dedupeTags(['', ' ', 'A'])).toEqual(['A'])
  })
})

describe('set helpers', () => {
  it('hasTag ignores case', () => {
    expect(hasTag(['Vendor'], 'vendor')).toBe(true)
    expect(hasTag(['Vendor'], 'Payroll')).toBe(false)
  })

  it('withoutTags removes case-insensitively', () => {
    expect(withoutTags(['Vendor', 'Payroll', 'Internal'], ['payroll', 'INTERNAL'])).toEqual(['Vendor'])
  })

  it('commonTags returns the intersection spelled as in the first list', () => {
    expect(commonTags([['Vendor', 'Internal'], ['internal', 'Payroll'], ['INTERNAL']])).toEqual(['Internal'])
    expect(commonTags([])).toEqual([])
    expect(commonTags([['A'], []])).toEqual([])
  })
})
