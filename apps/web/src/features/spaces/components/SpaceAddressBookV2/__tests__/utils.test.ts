import { faker } from '@faker-js/faker'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import type { SpaceAddressBookItemDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { Builder } from '@/tests/Builder'
import { chainBuilder } from '@/tests/builders/chains'
import { toLocalContacts, toWorkspaceContacts } from '../utils'

const itemBuilder = () =>
  Builder.new<SpaceAddressBookItemDto>().with({
    name: faker.person.fullName(),
    address: faker.finance.ethereumAddress(),
    chainIds: ['1'],
    createdBy: faker.internet.email(),
    createdByUserId: faker.number.int(),
    lastUpdatedBy: faker.internet.email(),
    lastUpdatedByUserId: faker.number.int(),
    createdAt: faker.date.past().toISOString(),
    updatedAt: faker.date.recent().toISOString(),
  })

const mainnet = chainBuilder().with({ chainId: '1', chainName: 'Ethereum', chainLogoUri: 'https://logo/1.png' }).build()
const gnosis = chainBuilder().with({ chainId: '100', chainName: 'Gnosis Chain', chainLogoUri: null }).build()
const configs = [mainnet, gnosis]

const noMember = () => undefined

describe('toWorkspaceContacts', () => {
  it('names each chain from the chain configs', () => {
    const item = itemBuilder()
      .with({ chainIds: ['1', '100'] })
      .build()

    const [contact] = toWorkspaceContacts([item], configs, noMember)

    expect(contact.chains).toEqual([
      { chainId: '1', chainName: 'Ethereum', chainLogoUri: 'https://logo/1.png', shortName: mainnet.shortName },
      { chainId: '100', chainName: 'Gnosis Chain', chainLogoUri: null, shortName: gnosis.shortName },
    ])
  })

  it('names a chain missing from the configs by its id', () => {
    const item = itemBuilder()
      .with({ chainIds: ['999'] })
      .build()

    const [contact] = toWorkspaceContacts([item], configs, noMember)

    expect(contact.chains).toEqual([{ chainId: '999', chainName: '999', chainLogoUri: null, shortName: '999' }])
  })

  it('resolves who added the contact from its creator', () => {
    const item = itemBuilder().with({ createdByUserId: 7 }).build()

    const [contact] = toWorkspaceContacts([item], configs, (userId) => (userId === 7 ? 'Maya Chen' : undefined))

    expect(contact).toEqual(expect.objectContaining({ name: item.name, address: item.address, addedBy: 'Maya Chen' }))
  })

  it.each([
    ['wallet address', faker.finance.ethereumAddress()],
    ['email', 'alice@example.com'],
  ])('falls back to the %s the contact was added with', (_, createdBy) => {
    const [contact] = toWorkspaceContacts([itemBuilder().with({ createdBy }).build()], configs, noMember)

    expect(contact.addedBy).toBe(createdBy)
  })

  it('knows nobody added the contact when neither is set', () => {
    const [contact] = toWorkspaceContacts([itemBuilder().with({ createdBy: '' }).build()], configs, noMember)

    expect(contact.addedBy).toBeUndefined()
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
        isLocal: true,
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
