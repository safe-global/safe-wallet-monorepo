import { checksumAddress } from '@safe-global/utils/utils/addresses'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import type { AllowlistEntry } from '@safe-global/views/features/spaces/components/Policies/types'
import { mockAllowlistPolicy } from '../../../mocks/allowlistPolicies'
import { MOCK_ADDRESSES, MOCK_TOKENS } from '../../../mocks/policies'
import { buildAllowlistRules, getAllowedTokenAddresses, getFormTokenAddresses } from '../allowlistForm'
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
    it('marks every live token as added, held or not, and held tokens that are not live as excluded', () => {
      const entries = [entry(usdc, [alice]), entry(usdt, [alice])]

      const values = toAllowlistEditValues(entries, [usdc.address.toLowerCase(), unknown])

      expect(values.addedTokens).toEqual([usdc.address, usdt.address])
      expect(values.excludedTokens).toEqual([unknown])
    })

    it('should keep a live token selected, when it is no longer held after the prefill', () => {
      const entries = [entry(usdc, [alice]), entry(usdt, [alice])]
      const values = toAllowlistEditValues(entries, [usdc.address, usdt.address])

      expect(getAllowedTokenAddresses([usdt.address], values)).toEqual([usdt.address, usdc.address])
    })

    it('should list a live token once, when it is both held and added', () => {
      const entries = [entry(usdc, [alice])]
      const values = toAllowlistEditValues(entries, [usdc.address.toLowerCase()])

      expect(getFormTokenAddresses([usdc.address.toLowerCase()], values)).toEqual([usdc.address.toLowerCase()])
    })

    it('lists the union of recipients once, selected, ignoring case', () => {
      const entries = [entry(usdc, [alice, bob]), entry(usdt, [alice.toLowerCase(), unresolved])]

      const { recipients } = toAllowlistEditValues(entries, [usdc.address, usdt.address])

      expect(recipients).toEqual([
        { address: checksumAddress(alice), selected: true },
        { address: checksumAddress(bob), selected: true },
        { address: checksumAddress(unresolved), selected: true },
      ])
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
    ])('is false for an untouched form when %s', (_, held) => {
      const desired = buildAllowlistRules(held, toAllowlistEditValues(entries, held))

      expect(hasAllowlistChanges(baseline, desired)).toBe(false)
    })

    it('is false for an untouched form with the native token', () => {
      const nativeEntries = [entry(native, [alice]), entry(usdc, [alice])]
      const held = [ZERO_ADDRESS, usdc.address]
      const desired = buildAllowlistRules(held, toAllowlistEditValues(nativeEntries, held))

      expect(hasAllowlistChanges(toAllowlistRules(nativeEntries), desired)).toBe(false)
    })

    it('is false for an untouched form when the live recipients differ per token', () => {
      const uneven = [entry(usdc, [alice, bob]), entry(usdt, [alice])]
      const held = [usdc.address, usdt.address]
      const desired = buildAllowlistRules(held, toAllowlistEditValues(uneven, held))

      expect(hasAllowlistChanges(toAllowlistRules(uneven), desired)).toBe(false)
    })

    it('is true when a recipient is deselected', () => {
      const held = [usdc.address, usdt.address]
      const values = toAllowlistEditValues(entries, held)
      values.recipients = values.recipients.map((r) => (r.address === bob ? { ...r, selected: false } : r))

      expect(hasAllowlistChanges(baseline, buildAllowlistRules(held, values))).toBe(true)
    })

    it('is true when a token is excluded', () => {
      const held = [usdc.address, usdt.address]
      const values = toAllowlistEditValues(entries, held)
      values.excludedTokens = [usdt.address]

      expect(hasAllowlistChanges(baseline, buildAllowlistRules(held, values))).toBe(true)
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
