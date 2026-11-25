import { faker } from '@faker-js/faker'
import { getAddress } from 'ethers'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import {
  RECIPIENT_DUPLICATE_ERROR,
  RECIPIENT_IS_SAFE_ERROR,
  RECIPIENT_RESERVED_ERROR,
} from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/constants'
import {
  createDefaultAllowlistValues,
  type AllowlistFormRecipient,
  type AllowlistToken,
  type RecipientAllowlistFormValues,
} from '../../types'
import {
  buildAllowlistRules,
  getAllowedTokenAddresses,
  getUniqueRecipients,
  isAllowlistComplete,
  parsePastedRecipient,
  selectAllowlistTokens,
  toggleByAddress,
  validateAllowlistRecipient,
} from '../allowlistForm'

const address = () => getAddress(faker.finance.ethereumAddress())
const token = (overrides: Partial<AllowlistToken> = {}): AllowlistToken => ({
  address: address(),
  symbol: faker.finance.currencyCode(),
  ...overrides,
})
const recipient = (overrides: Partial<AllowlistFormRecipient> = {}): AllowlistFormRecipient => ({
  address: address(),
  ...overrides,
})
const values = (overrides: Partial<RecipientAllowlistFormValues> = {}): RecipientAllowlistFormValues => ({
  ...createDefaultAllowlistValues(),
  ...overrides,
})

describe('allowlistForm', () => {
  describe('createDefaultAllowlistValues', () => {
    it('should, when a form starts, pick no token and no recipient', () => {
      expect(createDefaultAllowlistValues()).toEqual({ tokens: [], recipients: [] })
    })
  })

  describe('getAllowedTokenAddresses', () => {
    it('should, when held and other tokens are picked, list the held ones first in held order, then the rest as picked', () => {
      const [firstHeld, secondHeld, notPicked] = [address(), address(), address()]
      const custom = token()

      const result = getAllowedTokenAddresses(
        [firstHeld, notPicked, secondHeld],
        values({ tokens: [custom, token({ address: secondHeld }), token({ address: firstHeld })] }),
      )

      expect(result).toEqual([firstHeld, secondHeld, custom.address])
    })

    it('should, when a token is picked twice in different cases, list it once', () => {
      const picked = token()

      const result = getAllowedTokenAddresses(
        [],
        values({ tokens: [picked, { ...picked, address: picked.address.toLowerCase() }] }),
      )

      expect(result).toEqual([picked.address])
    })
  })

  describe('getUniqueRecipients', () => {
    it('should, when recipients differ only in address case, keep the first', () => {
      const first = recipient({ name: 'Alice' })
      const second = recipient({ address: first.address.toLowerCase(), name: 'Alice (old)' })
      const other = recipient()

      expect(getUniqueRecipients(values({ recipients: [first, other, second] }))).toEqual([first, other])
    })
  })

  describe('buildAllowlistRules', () => {
    it('should, when tokens and recipients are picked, return one rule per token listing every recipient, native included', () => {
      const erc20 = token()
      const [r1, r2] = [recipient(), recipient()]

      const rules = buildAllowlistRules(
        [ZERO_ADDRESS, erc20.address],
        values({ tokens: [erc20, token({ address: ZERO_ADDRESS })], recipients: [r1, r2] }),
      )

      expect(rules).toEqual([
        { tokenAddress: ZERO_ADDRESS, recipients: [r1.address, r2.address] },
        { tokenAddress: erc20.address, recipients: [r1.address, r2.address] },
      ])
    })

    it('should, when a held token is not picked, leave it out', () => {
      const picked = token()

      const rules = buildAllowlistRules(
        [address(), picked.address],
        values({ tokens: [picked], recipients: [recipient()] }),
      )

      expect(rules.map(({ tokenAddress }) => tokenAddress)).toEqual([picked.address])
    })

    it('should, when no recipient is picked, return no rules', () => {
      expect(buildAllowlistRules([], values({ tokens: [token()] }))).toEqual([])
    })

    it('should, when addresses are lowercase, checksum them', () => {
      const picked = token()
      const r = recipient()

      const rules = buildAllowlistRules(
        [],
        values({
          tokens: [{ ...picked, address: picked.address.toLowerCase() }],
          recipients: [{ ...r, address: r.address.toLowerCase() }],
        }),
      )

      expect(rules).toEqual([{ tokenAddress: picked.address, recipients: [r.address] }])
    })

    it('should, when a recipient is listed twice in different cases, list it once', () => {
      const r = recipient()

      const rules = buildAllowlistRules(
        [],
        values({ tokens: [token()], recipients: [r, { ...r, address: r.address.toLowerCase() }] }),
      )

      expect(rules[0].recipients).toEqual([r.address])
    })

    it('should, when there are several rules, give each its own recipients array', () => {
      const rules = buildAllowlistRules([], values({ tokens: [token(), token()], recipients: [recipient()] }))

      expect(rules[0].recipients).toEqual(rules[1].recipients)
      expect(rules[0].recipients).not.toBe(rules[1].recipients)
    })
  })

  describe('isAllowlistComplete', () => {
    it('should, when no token is picked, be false', () => {
      expect(isAllowlistComplete(values({ recipients: [recipient()] }))).toBe(false)
    })

    it('should, when no recipient is picked, be false', () => {
      expect(isAllowlistComplete(values({ tokens: [token()] }))).toBe(false)
    })

    it('should, when a token and a recipient are picked, be true', () => {
      expect(isAllowlistComplete(values({ tokens: [token()], recipients: [recipient()] }))).toBe(true)
    })
  })

  describe('toggleByAddress', () => {
    it('should, when the address is not listed, append the item', () => {
      const listed = token()
      const added = token()

      expect(toggleByAddress([listed], added)).toEqual([listed, added])
    })

    it('should, when the address is listed in another case, take it out', () => {
      const listed = recipient()
      const other = recipient()

      expect(toggleByAddress([listed, other], { address: listed.address.toLowerCase() })).toEqual([other])
    })
  })

  describe('selectAllowlistTokens', () => {
    it('should, when selecting, append only the listed tokens not picked yet', () => {
      const picked = token()
      const listed = token()

      expect(selectAllowlistTokens([picked], [{ ...picked, symbol: 'OTHER' }, listed], true)).toEqual([picked, listed])
    })

    it('should, when unselecting, take out only the listed tokens', () => {
      const [unlisted, listed] = [token(), token()]

      expect(selectAllowlistTokens([unlisted, listed], [listed], false)).toEqual([unlisted])
    })
  })

  describe('validateAllowlistRecipient', () => {
    const safeAddress = address()

    it('should, when the address is the Safe in another case, reject it', () => {
      expect(validateAllowlistRecipient(safeAddress.toLowerCase(), { safeAddress, existing: [] })).toBe(
        RECIPIENT_IS_SAFE_ERROR,
      )
    })

    it('should, when the address is reserved, reject it', () => {
      expect(validateAllowlistRecipient(ZERO_ADDRESS, { safeAddress, existing: [] })).toBe(RECIPIENT_RESERVED_ERROR)
    })

    it('should, when the address is already a recipient in another case, reject it', () => {
      const existing = recipient()

      expect(validateAllowlistRecipient(existing.address.toLowerCase(), { safeAddress, existing: [existing] })).toBe(
        RECIPIENT_DUPLICATE_ERROR,
      )
    })

    it('should, when the address is fresh, accept it', () => {
      expect(validateAllowlistRecipient(address(), { safeAddress, existing: [recipient()] })).toBeUndefined()
    })
  })

  describe('parsePastedRecipient', () => {
    const safeAddress = address()
    const options = { safeAddress, chainShortName: 'sep', existing: [] }

    it.each(['Alice', '0x12', ''])('should, when the query %p does not read as an address, return nothing', (query) => {
      expect(parsePastedRecipient(query, options)).toBeUndefined()
    })

    it('should, when a lowercase address is pasted with spaces, return it checksummed', () => {
      const pasted = address()

      expect(parsePastedRecipient(`  ${pasted.toLowerCase()} `, options)).toEqual({ address: pasted, error: undefined })
    })

    it("should, when the address has the chain's prefix, accept it without the prefix", () => {
      const pasted = address()

      expect(parsePastedRecipient(`sep:${pasted}`, options)).toEqual({ address: pasted, error: undefined })
    })

    it("should, when the prefix is another chain's, say so", () => {
      expect(parsePastedRecipient(`eth:${address()}`, options)?.error).toBe(`"eth" doesn't match the current chain`)
    })

    it('should, when the checksum is wrong, say so', () => {
      const pasted = address()
      const broken = pasted.replace(/[a-fA-F]/, (letter) =>
        letter === letter.toLowerCase() ? letter.toUpperCase() : letter.toLowerCase(),
      )

      expect(parsePastedRecipient(broken, options)?.error).toBe('Invalid address checksum')
    })

    it.each([
      ['the Safe itself', () => safeAddress, RECIPIENT_IS_SAFE_ERROR],
      ['a reserved address', () => ZERO_ADDRESS, RECIPIENT_RESERVED_ERROR],
    ])('should, when the address is %s, return its error', (_, pasted, error) => {
      expect(parsePastedRecipient(pasted(), options)?.error).toBe(error)
    })

    it('should, when the address is already a recipient, return the duplicate error', () => {
      const existing = recipient()

      expect(parsePastedRecipient(existing.address, { ...options, existing: [existing] })?.error).toBe(
        RECIPIENT_DUPLICATE_ERROR,
      )
    })
  })
})
