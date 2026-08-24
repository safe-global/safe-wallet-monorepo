import { renderHook } from '@/tests/test-utils'
import { useAddressBookWriteScope } from '../useAddressBookWriteScope'
import { useIsAdmin } from '../useSpaceMembers'
import { useSpaceSafes } from '../useSpaceSafes'
import { useIsSpaceRoute } from '@/hooks/useIsSpaceRoute'

jest.mock('../useSpaceMembers', () => ({ useIsAdmin: jest.fn() }))
jest.mock('../useSpaceSafes', () => ({ useSpaceSafes: jest.fn() }))
jest.mock('@/hooks/useIsSpaceRoute', () => ({ useIsSpaceRoute: jest.fn() }))

const WORKSPACE_SAFE = '0x1111111111111111111111111111111111111111'
const OUTSIDE_SAFE = '0x2222222222222222222222222222222222222222'

const setup = ({ isAdmin = false, isSpaceRoute = false } = {}) => {
  ;(useIsAdmin as jest.Mock).mockReturnValue(isAdmin)
  ;(useIsSpaceRoute as jest.Mock).mockReturnValue(isSpaceRoute)
  ;(useSpaceSafes as jest.Mock).mockReturnValue({
    allSafes: [{ address: WORKSPACE_SAFE, chainId: '1' }],
  })
}

describe('useAddressBookWriteScope', () => {
  beforeEach(() => jest.clearAllMocks())

  describe('canRename — who may rename', () => {
    it('blocks a member renaming a Safe the workspace owns', () => {
      setup({ isAdmin: false })
      expect(renderHook(() => useAddressBookWriteScope(WORKSPACE_SAFE)).result.current.canRename).toBe(false)
    })

    it('lets a member rename a Safe outside the workspace', () => {
      setup({ isAdmin: false })
      expect(renderHook(() => useAddressBookWriteScope(OUTSIDE_SAFE)).result.current.canRename).toBe(true)
    })

    it('lets an admin rename a Safe the workspace owns', () => {
      setup({ isAdmin: true })
      expect(renderHook(() => useAddressBookWriteScope(WORKSPACE_SAFE)).result.current.canRename).toBe(true)
    })

    it('matches the workspace Safe regardless of address casing', () => {
      setup({ isAdmin: false })
      const { result } = renderHook(() => useAddressBookWriteScope(WORKSPACE_SAFE.toUpperCase().replace('0X', '0x')))
      expect(result.current.canRename).toBe(false)
    })
  })

  describe('scope — where the write lands', () => {
    it('is workspace for an admin renaming a Safe the workspace owns', () => {
      setup({ isAdmin: true })
      expect(renderHook(() => useAddressBookWriteScope(WORKSPACE_SAFE)).result.current.scope).toBe('workspace')
    })

    it('is workspace for an admin on a space route, even for an address outside the workspace', () => {
      setup({ isAdmin: true, isSpaceRoute: true })
      expect(renderHook(() => useAddressBookWriteScope(OUTSIDE_SAFE)).result.current.scope).toBe('workspace')
    })

    it('is local for an admin off a space route renaming an address outside the workspace', () => {
      setup({ isAdmin: true, isSpaceRoute: false })
      expect(renderHook(() => useAddressBookWriteScope(OUTSIDE_SAFE)).result.current.scope).toBe('local')
    })

    it('is local for a member everywhere', () => {
      setup({ isAdmin: false, isSpaceRoute: true })
      expect(renderHook(() => useAddressBookWriteScope(WORKSPACE_SAFE)).result.current.scope).toBe('local')
    })
  })
})
