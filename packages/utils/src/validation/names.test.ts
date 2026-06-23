import { DISALLOWED_CHARACTER_MESSAGE, EMPTY_NAME_MESSAGE, NAME_MAX_LENGTH, sanitizeName, validateName } from './names'

const ZERO_WIDTH_SPACE = '​'
const BIDI_OVERRIDE = '‮'
const ZWJ = '‍'
const ZWNJ = '‌'

describe('sanitizeName', () => {
  it('normalizes decomposed input to NFC', () => {
    const decomposed = 'Jos' + 'é'
    expect(sanitizeName(decomposed)).toBe('José')
  })

  it.each([
    ['curly right apostrophe', 'O’Brien', "O'Brien"],
    ['curly left quote', '‘Mac’', "'Mac'"],
    ['prime', '5′ tall', "5' tall"],
    ['en dash', 'Jean–Luc', 'Jean-Luc'],
    ['em dash', 'Jean—Luc', 'Jean-Luc'],
  ])('folds smart punctuation: %s', (_label, input, expected) => {
    expect(sanitizeName(input)).toBe(expected)
  })

  it('strips a bidi override and keeps the visible remainder', () => {
    expect(sanitizeName(`ab${BIDI_OVERRIDE}cd`)).toBe('abcd')
  })

  it('strips zero-width characters', () => {
    expect(sanitizeName(`a${ZERO_WIDTH_SPACE}b${ZWJ}c${ZWNJ}d`)).toBe('abcd')
  })

  it('trims surrounding whitespace', () => {
    expect(sanitizeName('  Alice  ')).toBe('Alice')
  })
})

describe('validateName', () => {
  it.each(['José', '山田太郎', 'Müller', 'Анна', 'محمد علي'])('accepts UTF-8 letters: %s', (name) => {
    expect(validateName(sanitizeName(name))).toBeUndefined()
  })

  it.each([
    'Contact #1',
    'maria@web.com',
    'Smith & Co.',
    "O'Brien",
    'Acme, Inc.',
    'Doe (work)',
    'a-valid_Account.name',
  ])('accepts allowed punctuation: %s', (name) => {
    expect(validateName(sanitizeName(name))).toBeUndefined()
  })

  it.each([
    ['equals', 'ab=cd'],
    ['plus', 'ab+cd'],
    ['asterisk', 'ab*cd'],
    ['slash', 'ab/cd'],
    ['backslash', 'ab\\cd'],
    ['less-than', 'ab<cd'],
    ['greater-than', 'ab>cd'],
    ['double quote', 'ab"cd'],
    ['percent', 'ab%cd'],
    ['dollar', 'ab$cd'],
    ['colon', 'ab:cd'],
    ['semicolon', 'ab;cd'],
    ['pipe', 'ab|cd'],
    ['curly brace', 'ab{cd'],
    ['square bracket', 'ab[cd'],
    ['emoji', 'abc\u{1F44D}'],
    ['symbol', 'abc★'],
  ])('rejects disallowed character: %s', (_label, name) => {
    expect(validateName(sanitizeName(name))).toBe(DISALLOWED_CHARACTER_MESSAGE)
  })

  it('reports empty-name for input that is empty after sanitizing', () => {
    expect(validateName(sanitizeName(`${ZERO_WIDTH_SPACE}${BIDI_OVERRIDE}`))).toBe(EMPTY_NAME_MESSAGE)
  })

  it('reports empty-name (not min-length) for whitespace-only input', () => {
    expect(validateName(sanitizeName('   '))).toBe(EMPTY_NAME_MESSAGE)
  })

  it('rejects an emoji even when it satisfies length bounds', () => {
    expect(validateName('\u{1F44D}', { minLength: 1, maxLength: 1 })).toBe(DISALLOWED_CHARACTER_MESSAGE)
  })

  it('rejects a name shorter than the minimum', () => {
    expect(validateName('Jo')).toBe('Names must be at least 3 character(s) long')
  })

  it('rejects a name longer than the maximum', () => {
    expect(validateName('a'.repeat(NAME_MAX_LENGTH + 1))).toBe('Names must be at most 30 characters long')
  })

  it('counts max length by code point', () => {
    expect(validateName('山'.repeat(NAME_MAX_LENGTH))).toBeUndefined()
    expect(validateName('山'.repeat(NAME_MAX_LENGTH + 1))).toBe('Names must be at most 30 characters long')
  })

  it('respects a per-context max length override', () => {
    expect(validateName('a'.repeat(50), { maxLength: 50 })).toBeUndefined()
    expect(validateName('a'.repeat(51), { maxLength: 50 })).toBe('Names must be at most 50 characters long')
  })

  it('allows empty input when minLength is 0', () => {
    expect(validateName('', { minLength: 0 })).toBeUndefined()
  })
})
