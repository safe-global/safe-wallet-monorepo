import type { SpaceAddressBookItemDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { Builder } from '@/tests/Builder'
import { spaceAddressBookToCsv } from '../addressBookCsv'

const item = (address: string, name: string, chainIds: string[]) =>
  Builder.new<SpaceAddressBookItemDto>().with({ address, name, chainIds }).build()

describe('spaceAddressBookToCsv', () => {
  it('writes one importable row per chain', () => {
    const csv = spaceAddressBookToCsv([item('0xA', 'Treasury', ['1', '10']), item('0xB', 'Ops, EU', ['1'])])

    expect(csv.split(/\r?\n/)).toEqual(['address,name,chainId', '0xA,Treasury,1', '0xA,Treasury,10', '0xB,"Ops, EU",1'])
  })

  it('writes just the header for an empty book', () => {
    expect(spaceAddressBookToCsv([]).trim()).toBe('address,name,chainId')
  })
})
