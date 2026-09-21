import { spaceAddressBookToCsv } from '../addressBookCsv'

describe('spaceAddressBookToCsv', () => {
  it('writes one importable row per chain', () => {
    const csv = spaceAddressBookToCsv([
      { address: '0xA', name: 'Treasury', chainIds: ['1', '10'] },
      { address: '0xB', name: 'Ops, EU', chainIds: ['1'] },
    ] as never)

    expect(csv.split(/\r?\n/)).toEqual(['address,name,chainId', '0xA,Treasury,1', '0xA,Treasury,10', '0xB,"Ops, EU",1'])
  })

  it('writes just the header for an empty book', () => {
    expect(spaceAddressBookToCsv([]).trim()).toBe('address,name,chainId')
  })
})
