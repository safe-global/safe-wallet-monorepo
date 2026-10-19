import { faker } from '@faker-js/faker'
import { getAddress } from 'ethers'
import { renderHook, fakerChecksummedAddress } from '@/tests/test-utils'
import * as useChains from '@/hooks/useChains'
import type { RootState } from '@/store'
import useAddressPoisoningBatchCheck from '../useAddressPoisoningBatchCheck'

const lookalikeOf = (address: string) =>
  getAddress(
    `0x${address.slice(2, 6)}${faker.string.hexadecimal({ length: 32, prefix: '' })}${address.slice(-4)}`.toLowerCase(),
  )

describe('useAddressPoisoningBatchCheck', () => {
  const contact = fakerChecksummedAddress()
  const initialReduxState = { addressBook: { '1': { [contact]: faker.person.fullName() } } } as Partial<RootState>

  beforeEach(() => {
    jest.spyOn(useChains, 'useHasFeature').mockReturnValue(true)
  })

  const flaggedIn = (addresses: string[]) =>
    renderHook(() => useAddressPoisoningBatchCheck(addresses), { initialReduxState }).result.current

  it('flags addresses that look like a saved one', () => {
    const lookalike = lookalikeOf(contact)

    expect([...flaggedIn([lookalike, fakerChecksummedAddress()])]).toEqual([lookalike.toLowerCase()])
  })

  it('flags addresses in the list that look like each other', () => {
    const address = fakerChecksummedAddress()
    const lookalike = lookalikeOf(address)

    expect(flaggedIn([address, lookalike, fakerChecksummedAddress()])).toEqual(
      new Set([address.toLowerCase(), lookalike.toLowerCase()]),
    )
  })

  it('does not flag a saved address on its own', () => {
    expect(flaggedIn([contact, fakerChecksummedAddress()]).size).toBe(0)
  })

  it('flags nothing when the ADDRESS_POISONING_PROTECTION flag is off', () => {
    jest.spyOn(useChains, 'useHasFeature').mockReturnValue(false)
    const address = fakerChecksummedAddress()

    expect(flaggedIn([lookalikeOf(contact), address, lookalikeOf(address)]).size).toBe(0)
  })
})
