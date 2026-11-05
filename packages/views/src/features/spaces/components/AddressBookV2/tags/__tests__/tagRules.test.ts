import { faker } from '@faker-js/faker'
import { normalizeTagName, sameTagName, validateTagName } from '../tagRules'

describe('validateTagName', () => {
  it('accepts letters, numbers, spaces and - _ & /', () => {
    expect(validateTagName('R&D / EU-2_team')).toBeUndefined()
  })

  it('accepts letters outside the latin alphabet', () => {
    expect(validateTagName('供应商')).toBeUndefined()
  })

  it.each([
    ['an empty name', '   ', 'Tags cannot be empty'],
    ['a name over 32 characters', 'a'.repeat(33), 'Tags must be at most 32 characters long'],
    ['a name starting with =', '=SUM(1)', 'Tags cannot start with =, +, - or @'],
    ['a name starting with @', '@team', 'Tags cannot start with =, +, - or @'],
    ['a disallowed character', 'Vendor!', 'Tags can only contain letters, numbers, spaces and the characters - _ & /'],
  ])('rejects %s', (_, name, message) => {
    expect(validateTagName(name)).toBe(message)
  })

  it.each(['Workspace Safe', 'signer', '  SIGNER  ', 'workspace   safe'])(
    'rejects the automatic label name %s',
    (name) => {
      expect(validateTagName(name)).toMatch(/is added automatically and can't be used as a tag name$/)
    },
  )

  it('counts the length after collapsing spaces, as CGW does', () => {
    expect(validateTagName(`a${' '.repeat(10)}${'b'.repeat(30)}`)).toBeUndefined()
  })
})

describe('normalizeTagName', () => {
  it('trims and collapses runs of spaces', () => {
    expect(normalizeTagName('  Key   vendors  ')).toBe('Key vendors')
  })
})

describe('sameTagName', () => {
  it('ignores case and extra spaces', () => {
    const name = faker.word.noun()
    expect(sameTagName(name.toUpperCase(), `  ${name.toLowerCase()} `)).toBe(true)
  })
})
