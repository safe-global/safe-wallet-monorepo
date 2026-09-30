import * as allSafes from '../useAllSafes'
import { _buildSafeItems, _getMultiChainAccounts, useAllSafesGrouped } from '../useAllSafesGrouped'
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

    it('enumerates owned safes by default', () => {
      const spy = jest.spyOn(allSafes, 'default').mockReturnValue(undefined)

      renderHook(() => useAllSafesGrouped())

      expect(spy).toHaveBeenCalledWith(true)
    })

    it('forwards fetchOwnedSafes=false to skip the owners enumeration', () => {
      const spy = jest.spyOn(allSafes, 'default').mockReturnValue(undefined)

      renderHook(() => useAllSafesGrouped(undefined, false))

      expect(spy).toHaveBeenCalledWith(false)
    })
  })

  describe('_buildSafeItems', () => {
    // Overview/owned addresses are checksummed; space-safe addresses may differ in case. The owner
    // match must be case-insensitive, otherwise owned safes silently render read-only.
    const CHECKSUMMED = '0xAbC0000000000000000000000000000000000123'

    it('matches ownership case-insensitively', () => {
      const result = _buildSafeItems({ '1': [CHECKSUMMED] }, {}, { '1': [CHECKSUMMED.toLowerCase()] }, {})

      expect(result).toHaveLength(1)
      expect(result[0].isReadOnly).toBe(false)
    })

    it('marks a safe read-only when the wallet owns a different address on that chain', () => {
      const other = '0xDef0000000000000000000000000000000000456'.toLowerCase()
      const result = _buildSafeItems({ '1': [CHECKSUMMED] }, {}, { '1': [other] }, {})

      expect(result[0].isReadOnly).toBe(true)
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
