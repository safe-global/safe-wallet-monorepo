import { renderHook } from '@/tests/test-utils'
import { useHasRoles } from './useHasRoles'
import * as useRoles from './useRoles'
import { Role } from '../types'

describe('useHasRoles', () => {
  const useRolesSpy = jest.spyOn(useRoles, 'useRoles')

  const mockRoles = [Role.Owner, Role.Proposer, Role.Recoverer]

  beforeEach(() => {
    useRolesSpy.mockReturnValue(mockRoles)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should return true if user has all roles to check (non-exclusive)', () => {
    const { result } = renderHook(() => useHasRoles([Role.Owner, Role.Proposer]))
    expect(result.current).toBe(true)
  })

  it('should return false if user does not have all roles to check (non-exclusive)', () => {
    const { result } = renderHook(() => useHasRoles([Role.Owner, Role.NestedOwner]))
    expect(result.current).toBe(false)
  })

  it('should return true if user has exactly the roles to check (exclusive)', () => {
    const { result } = renderHook(() => useHasRoles([Role.Owner, Role.Proposer, Role.Recoverer], true))
    expect(result.current).toBe(true)
  })

  it('should return false if user does not have exactly the roles to check (exclusive)', () => {
    const { result } = renderHook(() => useHasRoles([Role.Owner, Role.Proposer], true))
    expect(result.current).toBe(false)
  })

  it('should return true if roles to check is empty', () => {
    const { result } = renderHook(() => useHasRoles([]))
    expect(result.current).toBe(true)
  })

  it('should return false if roles to check is empty and exclusive is true', () => {
    const { result } = renderHook(() => useHasRoles([], true))
    expect(result.current).toBe(false)
  })
})
