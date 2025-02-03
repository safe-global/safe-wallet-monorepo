import { renderHook } from '@/tests/test-utils'
import { useHasPermission } from './useHasPermission'
import * as usePermission from './usePermission'
import { Permission, Role } from '../config'

jest.mock('./usePermission')

describe('useHasPermission', () => {
  const usePermissionSpy = jest.spyOn(usePermission, 'usePermission')

  const mockPermissionValues = {
    [Role.Owner]: true,
    [Role.Proposer]: false,
    [Role.NestedOwner]: false,
  }

  beforeEach(() => {
    usePermissionSpy.mockReturnValue(mockPermissionValues)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should return true if any permission flag is true', () => {
    const { result } = renderHook(() => useHasPermission(Permission.CreateTransaction))
    expect(result.current).toBe(true)
    expect(usePermissionSpy).toHaveBeenCalledWith(Permission.CreateTransaction)
  })

  it('should return false if all permission flags are false', () => {
    usePermissionSpy.mockReturnValueOnce({
      [Role.Owner]: false,
      [Role.Proposer]: false,
      [Role.NestedOwner]: false,
    })

    const { result } = renderHook(() => useHasPermission(Permission.SignTransaction))

    expect(result.current).toBe(false)
    expect(usePermissionSpy).toHaveBeenCalledWith(Permission.SignTransaction)
  })

  it('should handle permissions with props', () => {
    const mockProps = { someProp: 'value' }

    const { result } = renderHook(() => useHasPermission(Permission.CreateSpendingLimitTransaction, mockProps as any))

    expect(result.current).toBe(true)
    expect(usePermissionSpy).toHaveBeenCalledWith(Permission.CreateSpendingLimitTransaction, mockProps)
  })
})
