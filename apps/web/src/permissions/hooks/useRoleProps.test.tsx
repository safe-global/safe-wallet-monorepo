import { renderHook } from '@/tests/test-utils'
import * as reactRedux from 'react-redux'
import { useRoleProps } from './useRoleProps'
import { Role } from '../types'
import * as spendingLimitsSlice from '@/store/spendingLimitsSlice'

describe('useRoleProps', () => {
  const selectSpendingLimitsSpy = jest.spyOn(spendingLimitsSlice, 'selectSpendingLimits')
  const useSelectorSpy = jest.spyOn(reactRedux, 'useSelector')

  const mockSpendingLimits = [{ limit: 1000 }, { limit: 2000 }] as unknown as spendingLimitsSlice.SpendingLimitState[]

  beforeEach(() => {
    selectSpendingLimitsSpy.mockReturnValue(mockSpendingLimits)
    useSelectorSpy.mockImplementation((sliceFn) => sliceFn({}))
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('SpendingLimitBeneficiary', () => {
    it('should return correct props', () => {
      const { result } = renderHook(() => useRoleProps())

      expect(result.current).toEqual({
        [Role.SpendingLimitBeneficiary]: { spendingLimits: mockSpendingLimits },
      })

      expect(useSelectorSpy).toHaveBeenCalledWith(expect.any(Function))
    })

    it('should return empty spendingLimits when selector returns undefined', () => {
      useSelectorSpy.mockReturnValue(undefined)

      const { result } = renderHook(() => useRoleProps())

      expect(result.current).toEqual({
        [Role.SpendingLimitBeneficiary]: { spendingLimits: undefined },
      })

      expect(useSelectorSpy).toHaveBeenCalledWith(expect.any(Function))
    })
  })
})
