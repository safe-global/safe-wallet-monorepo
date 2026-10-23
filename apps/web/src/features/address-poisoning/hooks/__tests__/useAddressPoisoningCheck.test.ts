import { faker } from '@faker-js/faker'
import { renderHook, fakerChecksummedAddress, fakerLookalikeAddress } from '@/tests/test-utils'
import * as useChains from '@/hooks/useChains'
import type { RootState } from '@/store'
import useAddressPoisoningCheck from '../useAddressPoisoningCheck'

describe('useAddressPoisoningCheck', () => {
  const contact = fakerChecksummedAddress()
  const contactName = faker.person.fullName()
  const safe = fakerChecksummedAddress()
  const initialReduxState = {
    addressBook: { '1': { [contact]: contactName } },
    addedSafes: { '1': { [safe]: { owners: [], threshold: 1 } } },
  } as Partial<RootState>

  beforeEach(() => {
    jest.spyOn(useChains, 'useHasFeature').mockReturnValue(true)
  })

  const check = (address: string | undefined) =>
    renderHook(() => useAddressPoisoningCheck(address), { initialReduxState }).result.current

  it('returns the saved contact an address looks like', () => {
    expect(check(fakerLookalikeAddress(contact))).toEqual({
      address: contact,
      name: contactName,
      source: 'addressBook',
    })
  })

  it('returns the Safe in my accounts an address looks like', () => {
    expect(check(fakerLookalikeAddress(safe))).toEqual({ address: safe, name: undefined, source: 'accounts' })
  })

  it('names a Safe in my accounts from the address book but still says it is in my accounts', () => {
    const safeName = faker.company.name()
    const state = {
      addressBook: { '1': { [safe]: safeName } },
      addedSafes: { '1': { [safe]: { owners: [], threshold: 1 } } },
    } as Partial<RootState>

    const { result } = renderHook(() => useAddressPoisoningCheck(fakerLookalikeAddress(safe)), {
      initialReduxState: state,
    })

    expect(result.current).toEqual({ address: safe, name: safeName, source: 'accounts' })
  })

  it('returns nothing for a saved address itself', () => {
    expect(check(contact)).toBeUndefined()
  })

  it('returns nothing for an unrelated address', () => {
    expect(check(fakerChecksummedAddress())).toBeUndefined()
  })

  it('returns nothing for an incomplete address', () => {
    expect(check(fakerLookalikeAddress(contact).slice(0, 20))).toBeUndefined()
    expect(check(undefined)).toBeUndefined()
  })

  it('returns nothing when the ADDRESS_POISONING_PROTECTION flag is off', () => {
    jest.spyOn(useChains, 'useHasFeature').mockReturnValue(false)

    expect(check(fakerLookalikeAddress(contact))).toBeUndefined()
  })
})
