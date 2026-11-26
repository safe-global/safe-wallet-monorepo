import { checksumAddress } from '@safe-global/utils/utils/addresses'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import type { AllowlistEntry } from '@safe-global/views/features/spaces/components/Policies/types'
import { mockAllowlistPolicy } from '../../../../../public/utils/allowlistPolicies'
import { MOCK_ADDRESSES, MOCK_TOKENS } from '../../../../../public/utils/policies'
import { buildAllowlistRules, getAllowedTokenAddresses } from '../allowlistForm'
import {
  hasAllowlistChanges,
  markAllowlistChanges,
  toAllowlistEditValues,
  toAllowlistRules,
  toFormBaseline,
} from '../allowlistEdit'

const { alice, bob, unresolved } = MOCK_ADDRESSES
const usdc = MOCK_TOKENS.usdc
const usdt = MOCK_TOKENS.usdt
const unknown = MOCK_TOKENS.unknown.address
const native = { address: ZERO_ADDRESS, symbol: 'ETH', decimals: 18, logoUri: null }

const entry = (token: AllowlistEntry['token'], accounts: string[]): AllowlistEntry => ({
  token,
  recipients: accounts.map((account) => ({ account, permission: 'ALWAYS' as const })),
})

describe('allowlistEdit', () => {
  describe('toAllowlistRules', () => {
    it('maps entries to token and recipient addresses', () => {
      const { entries } = mockAllowlistPolicy().data

      expect(toAllowlistRules(entries)).toEqual([
        { tokenAddress: usdc.address, recipients: [alice, bob, unresolved] },
        { tokenAddress: usdt.address, recipients: [alice, bob] },
      ])
    })
  })

  describe('toAllowlistEditValues', () => {
    it('should, when editing, pick every live token with its symbol and logo', () => {
      const entries = [entry(usdc, [alice]), entry({ ...usdt, logoUri: null }, [alice])]

      expect(toAllowlistEditValues(entries).tokens).toEqual([
        { address: usdc.address, symbol: usdc.symbol, logoUri: usdc.logoUri },
        { address: usdt.address, symbol: usdt.symbol, logoUri: undefined },
      ])
    })

    it('should, when a live token has no symbol, label it by its short address', () => {
      const nameless = { ...usdc, symbol: '' }

      expect(toAllowlistEditValues([entry(nameless, [alice])]).tokens[0].symbol).toBe(shortenAddress(usdc.address))
    })

    it('should, when the live tokens share recipients, pick each recipient once, ignoring case', () => {
      const entries = [entry(usdc, [alice, bob]), entry(usdt, [alice.toLowerCase(), unresolved])]

      const { recipients } = toAllowlistEditValues(entries)

      expect(recipients).toEqual([
        { address: checksumAddress(alice) },
        { address: checksumAddress(bob) },
        { address: checksumAddress(unresolved) },
      ])
    })

    it('should, when a live token is no longer held, keep it allowed', () => {
      const values = toAllowlistEditValues([entry(usdc, [alice]), entry(usdt, [alice])])

      expect(getAllowedTokenAddresses([usdt.address], values)).toEqual([usdt.address, usdc.address])
    })
  })

  describe('toFormBaseline', () => {
    it('gives every live token the union of the live recipients, once each, ignoring case', () => {
      const uneven = [entry(usdc, [alice, bob]), entry(usdt, [alice.toLowerCase(), unresolved])]

      expect(toFormBaseline(toAllowlistRules(uneven))).toEqual([
        { tokenAddress: usdc.address, recipients: [alice, bob, unresolved] },
        { tokenAddress: usdt.address, recipients: [alice, bob, unresolved] },
      ])
    })
  })

  describe('hasAllowlistChanges', () => {
    const entries = mockAllowlistPolicy().data.entries
    const baseline = toAllowlistRules(entries)

    it.each([
      ['held is a subset of live', [usdc.address]],
      ['live is a subset of held', [usdc.address, usdt.address, unknown]],
      ['held equals live', [usdc.address, usdt.address]],
    ])('should, when the form is untouched and %s, find no change', (_, held) => {
      const desired = buildAllowlistRules(held, toAllowlistEditValues(entries))

      expect(hasAllowlistChanges(baseline, desired)).toBe(false)
    })

    it('should, when the form is untouched with the native token, find no change', () => {
      const nativeEntries = [entry(native, [alice]), entry(usdc, [alice])]
      const desired = buildAllowlistRules([ZERO_ADDRESS, usdc.address], toAllowlistEditValues(nativeEntries))

      expect(hasAllowlistChanges(toAllowlistRules(nativeEntries), desired)).toBe(false)
    })

    it('should, when the form is untouched and the live recipients differ per token, find no change', () => {
      const uneven = [entry(usdc, [alice, bob]), entry(usdt, [alice])]
      const desired = buildAllowlistRules([usdc.address, usdt.address], toAllowlistEditValues(uneven))

      expect(hasAllowlistChanges(toAllowlistRules(uneven), desired)).toBe(false)
    })

    it('should, when a recipient is removed, find a change', () => {
      const values = toAllowlistEditValues(entries)
      values.recipients = values.recipients.filter((r) => r.address !== bob)

      expect(hasAllowlistChanges(baseline, buildAllowlistRules([], values))).toBe(true)
    })

    it('should, when a token is removed, find a change', () => {
      const values = toAllowlistEditValues(entries)
      values.tokens = values.tokens.filter((t) => t.address !== usdt.address)

      expect(hasAllowlistChanges(baseline, buildAllowlistRules([], values))).toBe(true)
    })

    it('is false when only the address case differs', () => {
      const even = [entry(usdc, [alice, bob]), entry(usdt, [alice, bob])]
      const evenRules = toAllowlistRules(even)
      const lower = evenRules.map(({ tokenAddress, recipients }) => ({
        tokenAddress: tokenAddress.toLowerCase(),
        recipients: recipients.map((r) => r.toLowerCase()),
      }))

      expect(lower).not.toEqual(evenRules)
      expect(hasAllowlistChanges(evenRules, lower)).toBe(false)
    })
  })

  describe('markAllowlistChanges', () => {
    const keyOf = (item: { id: string }) => item.id

    it('lists current items first, marking new ones added, then dropped ones removed', () => {
      const current = [{ id: 'a' }, { id: 'c' }]
      const previous = [{ id: 'a' }, { id: 'b' }]

      expect(markAllowlistChanges(current, previous, keyOf)).toEqual([
        { id: 'a' },
        { id: 'c', change: 'added' },
        { id: 'b', change: 'removed' },
      ])
    })
  })
})
