import { faker } from '@faker-js/faker'
import { renderHook, fakerChecksummedAddress, fakerLookalikeAddress } from '@/tests/test-utils'
import * as useChains from '@/hooks/useChains'
import type { RootState } from '@/store'
import useAddressPoisoningBatchCheck from '../useAddressPoisoningBatchCheck'

describe('useAddressPoisoningBatchCheck', () => {
  const contact = fakerChecksummedAddress()
  const initialReduxState = { addressBook: { '1': { [contact]: faker.person.fullName() } } } as Partial<RootState>

  beforeEach(() => {
    jest.spyOn(useChains, 'useHasFeature').mockReturnValue(true)
  })

  const flaggedIn = (addresses: string[]) =>
    renderHook(() => useAddressPoisoningBatchCheck(addresses), { initialReduxState }).result.current

  it('flags addresses that look like a saved one', () => {
    const lookalike = fakerLookalikeAddress(contact)

    expect([...flaggedIn([lookalike, fakerChecksummedAddress()])]).toEqual([lookalike.toLowerCase()])
  })

  it('flags addresses in the list that look like each other', () => {
    const address = fakerChecksummedAddress()
    const lookalike = fakerLookalikeAddress(address)

    expect(flaggedIn([address, lookalike, fakerChecksummedAddress()])).toEqual(
      new Set([address.toLowerCase(), lookalike.toLowerCase()]),
    )
  })

  it('does not flag a saved address on its own', () => {
    expect(flaggedIn([contact, fakerChecksummedAddress()]).size).toBe(0)
  })

  it('flags the look-alike but not the saved address it imitates', () => {
    const lookalike = fakerLookalikeAddress(contact)

    expect(flaggedIn([contact, lookalike])).toEqual(new Set([lookalike.toLowerCase()]))
  })

  it('does not flag saved addresses that look like each other, e.g. a re-imported backup', () => {
    const savedLookalike = fakerLookalikeAddress(contact)
    const state = {
      addressBook: { '1': { [contact]: faker.person.fullName(), [savedLookalike]: faker.person.fullName() } },
    } as Partial<RootState>

    const { result } = renderHook(() => useAddressPoisoningBatchCheck([contact, savedLookalike]), {
      initialReduxState: state,
    })

    expect(result.current.size).toBe(0)
  })

  it('flags nothing when the ADDRESS_POISONING_PROTECTION flag is off', () => {
    jest.spyOn(useChains, 'useHasFeature').mockReturnValue(false)
    const address = fakerChecksummedAddress()

    expect(flaggedIn([fakerLookalikeAddress(contact), address, fakerLookalikeAddress(address)]).size).toBe(0)
  })
})
