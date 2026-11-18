import { spaceAddressBookItemBuilder, spaceAddressBookTagBuilder } from '@/tests/builders/space'
import { spaceAddressBookToCsv, spaceAddressBookToCsvRows } from '../addressBookCsv'

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

describe('spaceAddressBookToCsvRows', () => {
  it("writes one row per chain with the contact's tag names", () => {
    const ops = spaceAddressBookTagBuilder().with({ id: 1, name: 'Ops' }).build()
    const vendor = spaceAddressBookTagBuilder().with({ id: 2, name: 'Vendor' }).build()
    const tagged = spaceAddressBookItemBuilder()
      .with({ chainIds: ['1', '10'], tagIds: [2, 1] })
      .build()
    const untagged = spaceAddressBookItemBuilder().build()

    expect(spaceAddressBookToCsvRows([tagged, untagged], [ops, vendor])).toEqual([
      { address: tagged.address, name: tagged.name, chainId: '1', tags: 'Vendor;Ops' },
      { address: tagged.address, name: tagged.name, chainId: '10', tags: 'Vendor;Ops' },
      { address: untagged.address, name: untagged.name, chainId: '1', tags: '' },
    ])
  })
})
