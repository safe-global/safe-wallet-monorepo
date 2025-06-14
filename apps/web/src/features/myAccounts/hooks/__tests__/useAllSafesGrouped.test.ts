import * as allSafes from '@/features/myAccounts/hooks/useAllSafes'
import { _getMultiChainAccounts, useAllSafesGrouped } from '@/features/myAccounts/hooks/useAllSafesGrouped'
import { safeItemBuilder } from '@/tests/builders/safeItem'
import { renderHook } from '@/tests/test-utils'
import { faker } from '@faker-js/faker'

describe('useAllSafesGrouped', () => {
  describe('hook', () => {
    beforeEach(() => {
      jest.clearAllMocks()
    })

    it('returns an object with empty arrays if there are no safes', () => {
      jest.spyOn(allSafes, 'default').mockReturnValue(undefined)

      const { result } = renderHook(() => useAllSafesGrouped())

      expect(result.current).toEqual({ allMultiChainSafes: undefined, allSingleSafes: undefined })
    })
  })

  describe('_getMultiChainAccounts', () => {
    it('returns an empty array if there are no multichain safes', () => {
      const safes = [safeItemBuilder().build(), safeItemBuilder().build()]
      const result = _getMultiChainAccounts(safes)

      expect(result).toEqual([])
    })

    it('returns an empty array if there is only one safe', () => {
      const safes = [safeItemBuilder().build()]
      const result = _getMultiChainAccounts(safes)

      expect(result).toEqual([])
    })

    it('returns a multichain safe item in case there are safes with the same address', () => {
      const mockSafeAddress = faker.finance.ethereumAddress()

      const mockFirstSafe = safeItemBuilder().with({ address: mockSafeAddress }).build()
      const mockSecondSafe = safeItemBuilder().with({ address: mockSafeAddress }).build()

      const safes = [mockFirstSafe, mockSecondSafe]
      const result = _getMultiChainAccounts(safes)

      expect(result.length).toEqual(1)
      expect(result[0].address).toEqual(mockSafeAddress)
      expect(result[0].safes.length).toEqual(2)
    })
  })
})
