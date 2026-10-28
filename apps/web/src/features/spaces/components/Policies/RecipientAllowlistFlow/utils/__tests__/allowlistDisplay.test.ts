import { faker } from '@faker-js/faker'
import { getAddress } from 'ethers'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import type { TokenOption } from '../../../SpendingLimitFlow/utils/tokenOptions'
import type { SafeAccountOption } from '@safe-global/views/features/spaces/components/Policies/SafeAccountSelector/types'
import type { ExtendedContact, MergedAddressBook } from '@/hooks/useAllAddressBooks'
import { createDefaultAllowlistValues, type AllowlistFormRecipient } from '../../types'
import {
  getAllowlistRecipientLabel,
  getAllowlistSafeLabel,
  isAllowlistGuardEnabled,
  toAllowlistRecipients,
  toAllowlistTokens,
} from '../allowlistDisplay'

const CHAIN_ID = '11155111'
const address = () => getAddress(faker.finance.ethereumAddress())
const token = (overrides: Partial<TokenOption> = {}): TokenOption => ({
  address: address(),
  symbol: 'USDC',
  name: 'USD Coin',
  decimals: 6,
  group: 'held',
  ...overrides,
})
const recipient = (overrides: Partial<AllowlistFormRecipient> = {}): AllowlistFormRecipient => ({
  address: address(),
  selected: true,
  ...overrides,
})
const addressBookWith = (contacts: Record<string, string>): Pick<MergedAddressBook, 'get' | 'has'> => ({
  get: (contact: string) => (contacts[contact] ? ({ name: contacts[contact] } as ExtendedContact) : undefined),
  has: (contact: string) => contact in contacts,
})

describe('allowlistDisplay', () => {
  describe('toAllowlistTokens', () => {
    it('labels a token by symbol, then name, then short address, and keeps its logo', () => {
      const withSymbol = token({ logoUri: 'https://logo' })
      const nameOnly = token({ symbol: '', name: 'No Symbol' })
      const unknown = address()

      expect(toAllowlistTokens([withSymbol.address, nameOnly.address, unknown], [withSymbol, nameOnly])).toEqual([
        { address: withSymbol.address, symbol: 'USDC', logoUri: 'https://logo' },
        { address: nameOnly.address, symbol: 'No Symbol', logoUri: undefined },
        { address: unknown, symbol: shortenAddress(unknown), logoUri: undefined },
      ])
    })
  })

  describe('toAllowlistRecipients', () => {
    it('lists each selected recipient once, named from the form or else the address book', () => {
      const named = recipient({ name: 'Alice' })
      const contact = recipient()
      const values = {
        ...createDefaultAllowlistValues(),
        recipients: [
          named,
          contact,
          recipient({ selected: false }),
          { ...named, address: named.address.toLowerCase() },
        ],
      }

      expect(toAllowlistRecipients(values, addressBookWith({ [contact.address]: 'Bob' }), CHAIN_ID)).toEqual([
        { address: named.address, name: 'Alice', isInAddressBook: false },
        { address: contact.address, name: 'Bob', isInAddressBook: true },
      ])
    })

    it('skips the address book without a chain', () => {
      const contact = recipient()
      const values = { ...createDefaultAllowlistValues(), recipients: [contact] }

      expect(toAllowlistRecipients(values, addressBookWith({ [contact.address]: 'Bob' }), undefined)).toEqual([
        { address: contact.address, name: undefined, isInAddressBook: false },
      ])
    })
  })

  it('labels a recipient by name, else by short address', () => {
    const unnamed = address()

    expect(getAllowlistRecipientLabel({ address: address(), name: 'Alice' })).toBe('Alice')
    expect(getAllowlistRecipientLabel({ address: unnamed })).toBe(shortenAddress(unnamed))
  })

  it('labels the Safe by name, else by short address, with its chain', () => {
    const safe: SafeAccountOption = { id: '', chainId: CHAIN_ID, address: address(), eligibility: 'signer' }

    expect(getAllowlistSafeLabel({ ...safe, name: 'Treasury' })).toBe(`Treasury on ${CHAIN_ID}`)
    expect(getAllowlistSafeLabel(safe)).toBe(`${shortenAddress(safe.address)} on ${CHAIN_ID}`)
  })

  it.each([
    ['none', false],
    ['known', true],
    ['partial', true],
  ])('treats the guard as enabled for %s: %s', (status, expected) => {
    expect(isAllowlistGuardEnabled({ status })).toBe(expected)
  })
})
