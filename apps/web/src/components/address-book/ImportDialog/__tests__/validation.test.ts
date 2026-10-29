import type { ParseMeta, ParseResult } from 'papaparse'
import {
  abCsvReaderValidator,
  abOnUploadValidator,
  hasValidAbEntryAddresses,
  hasValidAbHeader,
  hasValidAbNames,
} from '../validation'

describe('Address book import validation', () => {
  describe('abCsvReaderValidator', () => {
    it('should return undefined if file is valid', () => {
      const file = {
        type: 'text/csv',
        size: 100,
      } as File

      expect(abCsvReaderValidator(file)).toBeUndefined()
    })
    it('should return an error if file is too large', () => {
      const file = {
        type: 'text/csv',
        size: 1_000_000_000,
      } as File

      expect(abCsvReaderValidator(file)).toEqual(['Address book cannot be larger than 1MB'])
    })
  })
  describe('hasValidAbHeader', () => {
    it('should return true if header is valid', () => {
      const header = ['address', 'name', 'chainId']

      expect(hasValidAbHeader(header)).toBe(true)
    })
    it('should return false if header is invalid', () => {
      const header1 = ['a', 'name', 'chainId']
      const header2 = ['address', 'n', 'chainId', 'extra']
      const header3 = ['address', '']
      const header4 = [] as string[]

      expect(hasValidAbHeader(header1)).toBe(false)
      expect(hasValidAbHeader(header2)).toBe(false)
      expect(hasValidAbHeader(header3)).toBe(false)
      expect(hasValidAbHeader(header4)).toBe(false)
    })

    it('accepts a tags column after chainId', () => {
      expect(hasValidAbHeader(['address', 'name', 'chainId', 'tags'])).toBe(true)
    })

    it('rejects any other extra column, or tags followed by more', () => {
      expect(hasValidAbHeader(['address', 'name', 'chainId', 'note'])).toBe(false)
      expect(hasValidAbHeader(['address', 'name', 'chainId', 'tags', 'note'])).toBe(false)
    })
  })

  describe('hasValidAbEntryAddresses', () => {
    it('should return true if all entries have valid addresses', () => {
      const entries = [
        ['0xAb5e3288640396C3988af5a820510682f3C58adF', 'name', 'chainId'],
        ['0x1F2504De05f5167650bE5B28c472601Be434b60A', 'name1', 'chainId1'],
      ]

      expect(hasValidAbEntryAddresses(entries)).toBe(true)
    })

    it('should return false if any entry has invalid address', () => {
      const entries1 = [
        ['0xAb5e3288640396C3988af5a820510682f3C58adF', 'name', 'chainId'],
        ['0x1F2504De05f5167650bEA', 'name2', 'chainId2'],
      ]
      const entries2 = [['0xAb5e3288640396C3988af5a820510682f3C58adF', 'name', 'chainId', 'extra'], []]
      const entries3 = [['0x0', 'name', 'chainId', 'extra']]

      expect(hasValidAbEntryAddresses(entries1)).toBe(false)
      expect(hasValidAbEntryAddresses(entries2)).toBe(false)
      expect(hasValidAbEntryAddresses(entries3)).toBe(false)
    })
  })

  describe('hasValidAbNames', () => {
    it('should return true if all entries have valid names', () => {
      const entries = [
        ['0xAb5e3288640396C3988af5a820510682f3C58adF', 'name', 'chainId'],
        ['0x1F2504De05f5167650bE5B28c472601Be434b60A', 'name1', 'chainId1'],
      ]

      expect(hasValidAbNames(entries)).toBe(true)
    })

    it('should return false if any entry has invalid names', () => {
      const entries = [
        ['0xAb5e3288640396C3988af5a820510682f3C58adF', '', 'chainId'],
        ['0x1F2504De05f5167650bEA', 'name2', 'chainId2'],
      ]

      expect(hasValidAbNames(entries)).toBe(false)
    })
  })

  describe('abOnUploadValidator', () => {
    it('should return undefined if result is valid', () => {
      const result = {
        data: [
          ['address', 'name', 'chainId'],
          ['0xAb5e3288640396C3988af5a820510682f3C58adF', 'name', '1'],
        ],
        errors: [],
        meta: {} as ParseMeta,
      } as ParseResult<string[]>

      expect(abOnUploadValidator(result)).toBeUndefined()
    })

    it('should return the first error if the result contains errors', () => {
      const result = {
        data: [
          ['address', 'name', 'chainId'],
          ['0xAb5e3288640396C3988af5a820510682f3C58adF', 'name', '1'],
        ],
        errors: [{ message: 'Test error' }, { message: 'Test error 2' }],
        meta: {} as ParseMeta,
      } as ParseResult<string[]>

      expect(abOnUploadValidator(result)).toBe('Test error')
    })

    it('should return an error if the result contains no data', () => {
      const result = {
        data: [],
        errors: [],
        meta: {} as ParseMeta,
      } as ParseResult<string[]>

      expect(abOnUploadValidator(result)).toBe('CSV file is empty')
    })

    it('should return an error if the header is invalid', () => {
      const result = {
        data: [['incorrect', 'header', 'names']],
        errors: [],
        meta: {} as ParseMeta,
      } as ParseResult<string[]>

      expect(abOnUploadValidator(result)).toBe('Invalid or corrupt address book header')
    })

    it('should return an error if no entries are present', () => {
      const result = {
        data: [['address', 'name', 'chainId']],
        errors: [],
        meta: {} as ParseMeta,
      } as ParseResult<string[]>

      expect(abOnUploadValidator(result)).toBe('No entries found in address book')
    })

    it('should return an error if some entries have invalid addresses', () => {
      const result = {
        data: [
          ['address', 'name', 'chainId'],
          ['0x0', 'name', '1'],
        ],
        errors: [],
        meta: {} as ParseMeta,
      } as ParseResult<string[]>

      expect(abOnUploadValidator(result)).toBe('Address book contains an invalid address on row 2')
    })

    it('should return an error if some entries have empty names', () => {
      const result = {
        data: [
          ['address', 'name', 'chainId'],
          ['0xAb5e3288640396C3988af5a820510682f3C58adF', '', '1'],
        ],
        errors: [],
        meta: {} as ParseMeta,
      } as ParseResult<string[]>

      expect(abOnUploadValidator(result)).toBe('Address book contains an invalid name on row 2')
    })
  })
})
