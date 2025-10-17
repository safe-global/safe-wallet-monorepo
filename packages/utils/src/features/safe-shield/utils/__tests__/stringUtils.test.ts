import { capitalise, pluralise, formatCount } from '../stringUtils'

describe('stringUtils', () => {
  describe('capitalise', () => {
    it('should capitalise the first letter of a string', () => {
      expect(capitalise('hello')).toBe('Hello')
      expect(capitalise('world')).toBe('World')
      expect(capitalise('test')).toBe('Test')
    })

    it('should handle already capitalised strings', () => {
      expect(capitalise('Hello')).toBe('Hello')
      expect(capitalise('WORLD')).toBe('WORLD')
    })

    it('should handle single character strings', () => {
      expect(capitalise('a')).toBe('A')
      expect(capitalise('z')).toBe('Z')
    })

    it('should handle empty strings', () => {
      expect(capitalise('')).toBe('')
    })

    it('should handle strings with special characters', () => {
      expect(capitalise('123test')).toBe('123test')
      expect(capitalise('!hello')).toBe('!hello')
    })

    it('should handle strings with spaces', () => {
      expect(capitalise('hello world')).toBe('Hello world')
    })
  })

  describe('pluralise', () => {
    it('should return singular form when count is 1', () => {
      expect(pluralise(1, 'recipient')).toBe('recipient')
      expect(pluralise(1, 'item')).toBe('item')
      expect(pluralise(1, 'transaction')).toBe('transaction')
    })

    it('should return plural form when count is not 1', () => {
      expect(pluralise(0, 'recipient')).toBe('recipients')
      expect(pluralise(2, 'item')).toBe('items')
      expect(pluralise(10, 'transaction')).toBe('transactions')
    })

    it('should use custom plural form when provided', () => {
      expect(pluralise(2, 'person', 'people')).toBe('people')
      expect(pluralise(3, 'child', 'children')).toBe('children')
      expect(pluralise(5, 'mouse', 'mice')).toBe('mice')
    })

    it('should return singular with custom plural when count is 1', () => {
      expect(pluralise(1, 'person', 'people')).toBe('person')
      expect(pluralise(1, 'child', 'children')).toBe('child')
    })

    it('should handle edge cases', () => {
      expect(pluralise(-1, 'item')).toBe('items')
      expect(pluralise(1.5, 'item')).toBe('items')
    })
  })

  describe('formatCount', () => {
    it('should format count with singular form when count is 1', () => {
      expect(formatCount(1, 'recipient')).toBe('1 recipient')
      expect(formatCount(1, 'item')).toBe('1 item')
    })

    it('should format count with plural form when count is not 1', () => {
      expect(formatCount(0, 'recipient')).toBe('0 recipients')
      expect(formatCount(2, 'recipient')).toBe('2 recipients')
      expect(formatCount(10, 'item')).toBe('10 items')
    })

    it('should return "all" when count equals totalNumber', () => {
      expect(formatCount(5, 'recipient', 5)).toBe('all recipients')
      expect(formatCount(10, 'item', 10)).toBe('all items')
      expect(formatCount(1, 'item', 1)).toBe('all item') // Uses singular when count is 1
    })

    it('should not return "all" when count does not equal totalNumber', () => {
      expect(formatCount(3, 'recipient', 5)).toBe('3 recipients')
      expect(formatCount(1, 'item', 3)).toBe('1 item')
    })

    it('should use custom plural form when provided', () => {
      expect(formatCount(2, 'person', undefined, 'people')).toBe('2 people')
      expect(formatCount(5, 'child', undefined, 'children')).toBe('5 children')
    })

    it('should work with "all" and custom plural form', () => {
      expect(formatCount(3, 'person', 3, 'people')).toBe('all people')
      expect(formatCount(5, 'child', 5, 'children')).toBe('all children')
    })

    it('should handle totalNumber as undefined', () => {
      expect(formatCount(5, 'recipient', undefined)).toBe('5 recipients')
      expect(formatCount(1, 'recipient', undefined)).toBe('1 recipient')
    })

    it('should handle edge cases', () => {
      expect(formatCount(0, 'item')).toBe('0 items')
      expect(formatCount(0, 'item', 0)).toBe('all items')
    })
  })
})
