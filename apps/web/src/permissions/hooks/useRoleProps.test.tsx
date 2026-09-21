import { renderHook } from '@/tests/test-utils'
import * as reactRedux from 'react-redux'
import { useRoleProps } from './useRoleProps'
import { Role } from '../config'
import type { SpendingLimitState } from '@/features/spending-limits'

describe('useRoleProps', () => {
  const useSelectorSpy = jest.spyOn(reactRedux, 'useSelector')

  const mockSpendingLimits = [{ limit: 1000 }, { limit: 2000 }] as unknown as SpendingLimitState[]

  beforeEach(() => {
    useSelectorSpy.mockReturnValue(mockSpendingLimits)
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
