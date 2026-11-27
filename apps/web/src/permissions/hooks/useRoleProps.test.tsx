import { renderHook } from '@/tests/test-utils'
import { spendingLimitStateBuilder } from '@/tests/builders/spendingLimits'
import useSpendingLimits from '@/features/spending-limits/public/hooks/useSpendingLimits'
import { useRoleProps } from './useRoleProps'
import { Role } from '../config'

jest.mock('@/features/spending-limits/public/hooks/useSpendingLimits')

describe('useRoleProps', () => {
  it("gives the spending limit beneficiary role the open Safe's spending limits", () => {
    const spendingLimits = [spendingLimitStateBuilder().build(), spendingLimitStateBuilder().build()]
    jest.mocked(useSpendingLimits).mockReturnValue({ spendingLimits, loading: false })

    const { result } = renderHook(() => useRoleProps())

    expect(result.current).toEqual({ [Role.SpendingLimitBeneficiary]: { spendingLimits } })
  })
})
