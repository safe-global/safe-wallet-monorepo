import { faker } from '@faker-js/faker'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import { getSafeOptions, getSelectedSafeAddresses, isSafeOptionSelected, toggleSafeOption } from './utils'

describe('TransactionsToolbar utils', () => {
  const safeA = checksumAddress(faker.finance.ethereumAddress())
  const safeB = checksumAddress(faker.finance.ethereumAddress())

  describe('getSafeOptions', () => {
    it('joins the chains of a Safe, adding their counts, and sorts the Safes by count', () => {
      const options = getSafeOptions([
        { chainId: '1', safeAddress: safeA, count: 1 },
        { chainId: '1', safeAddress: safeB, count: 3 },
        { chainId: '100', safeAddress: safeA.toLowerCase(), count: 4 },
      ])

      expect(options).toEqual([
        { safeAddress: safeA, chainIds: ['1', '100'], count: 5 },
        { safeAddress: safeB, chainIds: ['1'], count: 3 },
      ])
    })

    it('returns no options without Safes', () => {
      expect(getSafeOptions([])).toEqual([])
    })
  })

  describe('isSafeOptionSelected and toggleSafeOption', () => {
    const option = { safeAddress: safeA, chainIds: ['1', '100'], count: 2 }

    it('selects every chain of a Safe', () => {
      const selected = toggleSafeOption(option, [{ chainId: '1', safeAddress: safeB }])

      expect(selected).toEqual([
        { chainId: '1', safeAddress: safeB },
        { chainId: '1', safeAddress: safeA },
        { chainId: '100', safeAddress: safeA },
      ])
      expect(isSafeOptionSelected(option, selected)).toBe(true)
    })

    it('removes every chain of a selected Safe', () => {
      const selected = toggleSafeOption(option, [
        { chainId: '1', safeAddress: safeA },
        { chainId: '100', safeAddress: safeA.toLowerCase() },
        { chainId: '1', safeAddress: safeB },
      ])

      expect(selected).toEqual([{ chainId: '1', safeAddress: safeB }])
    })

    it('treats a Safe with only some chains selected as not selected, and completes it', () => {
      const partial = [{ chainId: '1', safeAddress: safeA }]

      expect(isSafeOptionSelected(option, partial)).toBe(false)
      expect(toggleSafeOption(option, partial)).toEqual([
        { chainId: '1', safeAddress: safeA },
        { chainId: '100', safeAddress: safeA },
      ])
    })
  })

  describe('getSelectedSafeAddresses', () => {
    it('keeps one entry per Safe, in selection order', () => {
      expect(
        getSelectedSafeAddresses([
          { chainId: '1', safeAddress: safeB },
          { chainId: '1', safeAddress: safeA },
          { chainId: '100', safeAddress: safeB },
        ]),
      ).toEqual([
        { chainId: '1', safeAddress: safeB },
        { chainId: '1', safeAddress: safeA },
      ])
    })
  })
})
