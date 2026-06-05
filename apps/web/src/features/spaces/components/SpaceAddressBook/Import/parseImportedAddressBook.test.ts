import { parseImportedAddressBook } from './parseImportedAddressBook'

const ADDR_1 = '0xAecDFD3A19f777F0c03e6bf99AAfB59937d6467b'
const ADDR_2 = '0x3819b800c67Be64029C1393c8b2e0d0d627dADE2'
const ADDR_3 = '0x7cB6E6Cbc845e79d9CA05F6577141DA36ad398f5'

const SUPPORTED = ['1', '5']

describe('parseImportedAddressBook', () => {
  describe('CSV', () => {
    it('parses a valid CSV into address book items', () => {
      const csv = `address,name,chainId\n${ADDR_1},Alice,1\n${ADDR_2},Bob,5`

      const { items, error } = parseImportedAddressBook('book.csv', csv, SUPPORTED)

      expect(error).toBeUndefined()
      expect(items).toEqual([
        { address: ADDR_1, name: 'Alice', chainIds: ['1'] },
        { address: ADDR_2, name: 'Bob', chainIds: ['5'] },
      ])
    })

    it('rejects a CSV with an invalid header', () => {
      const csv = `foo,bar,baz\n${ADDR_1},Alice,1`

      const { items, error } = parseImportedAddressBook('book.csv', csv, SUPPORTED)

      expect(items).toEqual([])
      expect(error).toBe('Invalid or corrupt address book header')
    })

    it('rejects a CSV with an invalid address', () => {
      const csv = `address,name,chainId\nnot-an-address,Alice,1`

      const { error } = parseImportedAddressBook('book.csv', csv, SUPPORTED)

      expect(error).toMatch(/invalid address/i)
    })

    it('drops entries on unsupported chains', () => {
      const csv = `address,name,chainId\n${ADDR_1},Alice,1\n${ADDR_2},Bob,999`

      const { items, error } = parseImportedAddressBook('book.csv', csv, SUPPORTED)

      expect(error).toBeUndefined()
      expect(items).toEqual([{ address: ADDR_1, name: 'Alice', chainIds: ['1'] }])
    })

    it('errors when no entries remain after filtering unsupported chains', () => {
      const csv = `address,name,chainId\n${ADDR_1},Alice,999`

      const { items, error } = parseImportedAddressBook('book.csv', csv, SUPPORTED)

      expect(items).toEqual([])
      expect(error).toMatch(/no .*supported/i)
    })
  })

  it('trims whitespace around names from CSV imports', () => {
    const csv = `address,name,chainId\n${ADDR_1},  Alice  ,1`

    const { items, error } = parseImportedAddressBook('book.csv', csv, SUPPORTED)

    expect(error).toBeUndefined()
    expect(items).toEqual([{ address: ADDR_1, name: 'Alice', chainIds: ['1'] }])
  })

  it('trims whitespace around names from JSON imports', () => {
    const json = JSON.stringify({
      version: '2.0',
      data: { addressBook: { '1': { [ADDR_1]: '  Alice  ' } } },
    })

    const { items } = parseImportedAddressBook('export.json', json, SUPPORTED)

    expect(items).toEqual([{ address: ADDR_1, name: 'Alice', chainIds: ['1'] }])
  })

  describe('JSON', () => {
    it('parses the global data-export shape into address book items', () => {
      const json = JSON.stringify({
        version: '2.0',
        data: {
          addressBook: {
            '1': { [ADDR_1]: 'Alice', [ADDR_3]: 'Carol' },
            '5': { [ADDR_2]: 'Bob' },
          },
        },
      })

      const { items, error } = parseImportedAddressBook('export.json', json, SUPPORTED)

      expect(error).toBeUndefined()
      expect(items).toEqual(
        expect.arrayContaining([
          { address: ADDR_1, name: 'Alice', chainIds: ['1'] },
          { address: ADDR_3, name: 'Carol', chainIds: ['1'] },
          { address: ADDR_2, name: 'Bob', chainIds: ['5'] },
        ]),
      )
      expect(items).toHaveLength(3)
    })

    it('rejects malformed JSON', () => {
      const { error } = parseImportedAddressBook('export.json', '{ not json', SUPPORTED)

      expect(error).toMatch(/json/i)
    })

    it('rejects an unsupported export version', () => {
      const json = JSON.stringify({ version: '99.0', data: { something: {} } })

      const { error } = parseImportedAddressBook('export.json', json, SUPPORTED)

      expect(error).toBeTruthy()
    })

    it('errors when the export contains no address book entries', () => {
      const json = JSON.stringify({ version: '2.0', data: { addedSafes: {} } })

      const { items, error } = parseImportedAddressBook('export.json', json, SUPPORTED)

      expect(items).toEqual([])
      expect(error).toBeTruthy()
    })

    it('drops entries on unsupported chains', () => {
      const json = JSON.stringify({
        version: '2.0',
        data: { addressBook: { '1': { [ADDR_1]: 'Alice' }, '999': { [ADDR_2]: 'Bob' } } },
      })

      const { items } = parseImportedAddressBook('export.json', json, SUPPORTED)

      expect(items).toEqual([{ address: ADDR_1, name: 'Alice', chainIds: ['1'] }])
    })
  })

  it('rejects unsupported file types', () => {
    const { items, error } = parseImportedAddressBook('book.txt', 'whatever', SUPPORTED)

    expect(items).toEqual([])
    expect(error).toMatch(/csv|json/i)
  })
})
