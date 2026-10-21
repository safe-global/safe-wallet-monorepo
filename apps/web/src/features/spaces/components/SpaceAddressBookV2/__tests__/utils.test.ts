import { faker } from '@faker-js/faker'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import { chainBuilder } from '@/tests/builders/chains'
import { spaceAddressBookItemBuilder, spaceAddressBookTagBuilder } from '@/tests/builders/space'
import { staleCasingKeys, storedKeysOf, tagNamesOf, toLocalContacts, toWorkspaceContacts } from '../utils'

const itemBuilder = spaceAddressBookItemBuilder

const mainnet = chainBuilder().with({ chainId: '1', chainName: 'Ethereum', chainLogoUri: 'https://logo/1.png' }).build()
const gnosis = chainBuilder().with({ chainId: '100', chainName: 'Gnosis Chain', chainLogoUri: null }).build()
const configs = [mainnet, gnosis]

const noMember = () => undefined

describe('toWorkspaceContacts', () => {
  it('names each chain from the chain configs', () => {
    const item = itemBuilder()
      .with({ chainIds: ['1', '100'] })
      .build()

    const [contact] = toWorkspaceContacts([item], [], configs, noMember)

    expect(contact.chains).toEqual([
      { chainId: '1', chainName: 'Ethereum', chainLogoUri: 'https://logo/1.png', shortName: mainnet.shortName },
      { chainId: '100', chainName: 'Gnosis Chain', chainLogoUri: null, shortName: gnosis.shortName },
    ])
  })

  it('names a chain missing from the configs by its id', () => {
    const item = itemBuilder()
      .with({ chainIds: ['999'] })
      .build()

    const [contact] = toWorkspaceContacts([item], [], configs, noMember)

    expect(contact.chains).toEqual([{ chainId: '999', chainName: '999', chainLogoUri: null, shortName: '999' }])
  })

  it('resolves who added the contact from its creator', () => {
    const item = itemBuilder().with({ createdByUserId: 7 }).build()

    const [contact] = toWorkspaceContacts([item], [], configs, (userId) => (userId === 7 ? 'Maya Chen' : undefined))

    expect(contact).toEqual(expect.objectContaining({ name: item.name, address: item.address, addedBy: 'Maya Chen' }))
  })

  it.each([
    ['wallet address', faker.finance.ethereumAddress()],
    ['email', 'alice@example.com'],
  ])('falls back to the %s the contact was added with', (_, createdBy) => {
    const [contact] = toWorkspaceContacts([itemBuilder().with({ createdBy }).build()], [], configs, noMember)

    expect(contact.addedBy).toBe(createdBy)
  })

  it('gives each contact its tags in its own order, with their names and colours', () => {
    const vendor = spaceAddressBookTagBuilder().with({ id: 1 }).build()
    const payroll = spaceAddressBookTagBuilder().with({ id: 2 }).build()
    const item = itemBuilder()
      .with({ tagIds: [2, 1] })
      .build()

    const [contact] = toWorkspaceContacts([item], [vendor, payroll], configs, noMember)

    expect(contact.tags).toEqual([
      { id: 2, name: payroll.name, color: payroll.color },
      { id: 1, name: vendor.name, color: vendor.color },
    ])
  })

  it('leaves out a tag id the workspace no longer has', () => {
    const vendor = spaceAddressBookTagBuilder().with({ id: 1 }).build()
    const item = itemBuilder()
      .with({ tagIds: [1, 99] })
      .build()

    const [contact] = toWorkspaceContacts([item], [vendor], configs, noMember)

    expect(contact.tags?.map((tag) => tag.id)).toEqual([1])
  })

  it('knows nobody added the contact when neither is set', () => {
    const [contact] = toWorkspaceContacts([itemBuilder().with({ createdBy: '' }).build()], [], configs, noMember)

    expect(contact.addedBy).toBeUndefined()
  })
})

describe('tagNamesOf', () => {
  it("names the contact's tags in its own order", () => {
    const vendor = spaceAddressBookTagBuilder().with({ id: 1 }).build()
    const payroll = spaceAddressBookTagBuilder().with({ id: 2 }).build()
    const item = itemBuilder()
      .with({ tagIds: [2, 1] })
      .build()

    expect(tagNamesOf(item, [vendor, payroll])).toEqual([payroll.name, vendor.name])
  })
})

describe('toLocalContacts', () => {
  const address = faker.finance.ethereumAddress()

  it('merges a contact saved on several chains into one', () => {
    const contacts = toLocalContacts(
      { '1': { [address]: 'Hardware wallet' }, '100': { [address]: 'Hardware wallet' } },
      [],
      configs,
    )

    expect(contacts).toEqual([
      {
        address,
        name: 'Hardware wallet',
        chains: [
          { chainId: '1', chainName: 'Ethereum', chainLogoUri: 'https://logo/1.png', shortName: mainnet.shortName },
          { chainId: '100', chainName: 'Gnosis Chain', chainLogoUri: null, shortName: gnosis.shortName },
        ],
        isShared: false,
      },
    ])
  })

  it('matches addresses across chains regardless of case', () => {
    const contacts = toLocalContacts(
      {
        '1': { [address.toLowerCase()]: 'Hardware wallet' },
        '100': { [address.toUpperCase().replace('0X', '0x')]: 'Hw' },
      },
      [],
      configs,
    )

    expect(contacts).toHaveLength(1)
    expect(contacts[0].chains.map((chain) => chain.chainId)).toEqual(['1', '100'])
  })

  it('lists a chain once when the same address is saved on it in two casings', () => {
    const contacts = toLocalContacts(
      { '1': { [checksumAddress(address)]: 'Hardware wallet', [address.toLowerCase()]: 'Hardware wallet' } },
      [],
      configs,
    )

    expect(contacts[0].chains.map((chain) => chain.chainId)).toEqual(['1'])
  })

  it('marks contacts the workspace already has as shared and lists them last', () => {
    const shared = faker.finance.ethereumAddress()
    const workspaceItem = itemBuilder().with({ address: shared.toLowerCase() }).build()

    const contacts = toLocalContacts(
      { '1': { [shared]: 'Treasury', [address]: 'Hardware wallet' } },
      [workspaceItem],
      configs,
    )

    expect(contacts.map((contact) => [contact.name, contact.isShared])).toEqual([
      ['Hardware wallet', false],
      ['Treasury', true],
    ])
  })
})

describe('storedKeysOf', () => {
  const address = checksumAddress(faker.finance.ethereumAddress())
  const other = checksumAddress(faker.finance.ethereumAddress())

  it('finds every casing of the address on every chain', () => {
    const keys = storedKeysOf(
      {
        '1': { [address]: 'Hardware wallet', [address.toLowerCase()]: 'Hw', [other]: 'Other' },
        '100': { [address.toLowerCase()]: 'Hardware wallet' },
      },
      address.toLowerCase(),
    )

    expect(keys).toEqual([
      { chainId: '1', address },
      { chainId: '1', address: address.toLowerCase() },
      { chainId: '100', address: address.toLowerCase() },
    ])
  })

  it('looks only at the chains it is given', () => {
    const keys = storedKeysOf(
      { '1': { [address]: 'Hardware wallet' }, '100': { [address]: 'Hardware wallet' } },
      address,
      ['100'],
    )

    expect(keys).toEqual([{ chainId: '100', address }])
  })
})

describe('staleCasingKeys', () => {
  const address = checksumAddress(faker.finance.ethereumAddress())
  const lower = address.toLowerCase()
  const before = { '1': { [address]: 'Hardware wallet' }, '100': { [lower]: 'Hardware wallet' } }

  it('returns the other casings once the address was saved under one of them', () => {
    const after = { '1': { [address]: 'Renamed' }, '100': { [lower]: 'Hardware wallet', [address]: 'Renamed' } }

    expect(staleCasingKeys(before, after, address, ['1', '100'])).toEqual([{ chainId: '100', address: lower }])
  })

  it('returns nothing when nothing was saved', () => {
    expect(staleCasingKeys(before, before, address, ['1', '100'])).toEqual([])
  })

  it('leaves chains outside the contact alone', () => {
    const books = { ...before, '5': { [lower]: 'Elsewhere' } }
    const after = {
      ...books,
      '1': { [address]: 'Renamed' },
      '100': { [lower]: 'Hardware wallet', [address]: 'Renamed' },
    }

    expect(staleCasingKeys(books, after, address, ['1', '100'])).toEqual([{ chainId: '100', address: lower }])
  })
})
