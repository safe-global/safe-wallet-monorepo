import { faker } from '@faker-js/faker'
import type { SpaceAddressBookItemDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { describeSuggestion } from '@safe-global/views/features/spaces/components/AddressBookV2/types'
import { Builder } from '@/tests/Builder'
import { chainBuilder } from '@/tests/builders/chains'
import type { SignedSafe, WorkspaceSigner } from '../../../hooks/useWorkspaceSigners'
import { suggestedSignerName, toSuggestedContacts } from '../suggestions'

const safe = (overrides: Partial<SignedSafe> = {}): SignedSafe => ({
  address: faker.finance.ethereumAddress(),
  name: faker.word.noun(),
  position: 1,
  ...overrides,
})

const signer = (overrides: Partial<WorkspaceSigner> = {}): WorkspaceSigner => ({
  address: faker.finance.ethereumAddress(),
  chainIds: ['1'],
  safes: [safe()],
  ...overrides,
})

const bookItem = (address: string) =>
  Builder.new<SpaceAddressBookItemDto>()
    .with({ name: faker.person.fullName(), address, chainIds: ['1'] })
    .build()

describe('suggestedSignerName', () => {
  it('names a signer after its Safe and owner position', () => {
    expect(suggestedSignerName(safe({ name: 'Treasury', position: 2 }))).toBe('Treasury signer 2')
  })

  it('uses the short Safe address when the Safe has no name', () => {
    const address = faker.finance.ethereumAddress()

    expect(suggestedSignerName(safe({ address, name: undefined, position: 1 }))).toBe(
      `Safe ${address.slice(0, 6)}...${address.slice(-4)} signer 1`,
    )
  })

  it('cuts a long Safe name so the whole name fits in 50 characters', () => {
    const name = suggestedSignerName(safe({ name: 'a'.repeat(48), position: 3 }))

    expect(name).toHaveLength(50)
    expect(name.endsWith(' signer 3')).toBe(true)
    expect(name).not.toContain('…')
  })
})

describe('toSuggestedContacts', () => {
  it('picks the Safe whose name sorts first and lists every Safe in the reason', () => {
    const [contact] = toSuggestedContacts(
      [signer({ safes: [safe({ name: 'Treasury', position: 1 }), safe({ name: 'Payroll', position: 2 })] })],
      [],
      [],
    )

    expect(contact.suggestedName).toBe('Payroll signer 2')
    expect(contact.reason).toEqual({ kind: 'signer', safes: ['Payroll', 'Treasury'] })
  })

  it('skips addresses already in the workspace book in any casing', () => {
    const known = signer({ address: faker.finance.ethereumAddress() })
    const other = signer()
    const book = [bookItem(known.address.toUpperCase().replace('0X', '0x'))]

    const contacts = toSuggestedContacts([known, other], book, [])

    expect(contacts.map((contact) => contact.address)).toEqual([other.address])
  })

  it('names a nested Safe owner like any other signer', () => {
    const nested = signer({ safes: [safe({ name: 'Treasury', position: 3 })] })

    const [contact] = toSuggestedContacts([nested], [], [])

    expect(contact.suggestedName).toBe('Treasury signer 3')
  })

  it('maps signer chains to chain infos', () => {
    const mainnet = chainBuilder().with({ chainId: '1', chainName: 'Ethereum', chainLogoUri: null }).build()

    const [contact] = toSuggestedContacts([signer({ chainIds: ['1'] })], [], [mainnet])

    expect(contact.chains).toEqual([
      { chainId: '1', chainName: 'Ethereum', chainLogoUri: null, shortName: mainnet.shortName },
    ])
  })

  it('sorts contacts by suggested name', () => {
    const b = signer({ safes: [safe({ name: 'Bravo' })] })
    const a = signer({ safes: [safe({ name: 'Alpha' })] })

    const contacts = toSuggestedContacts([b, a], [], [])

    expect(contacts.map((contact) => contact.address)).toEqual([a.address, b.address])
  })
})

describe('describeSuggestion', () => {
  it('describes a signer suggestion', () => {
    expect(describeSuggestion({ kind: 'signer', safes: ['Payroll', 'Treasury'] })).toBe('Signer of Payroll, Treasury')
  })
})
