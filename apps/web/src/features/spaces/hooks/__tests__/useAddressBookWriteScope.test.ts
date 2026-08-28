import { renderHook } from '@/tests/test-utils'
import { useSpaceSafesGetV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useAddressBookWriteScope } from '../useAddressBookWriteScope'
import { useCurrentSpaceId } from '../useCurrentSpaceId'
import { useIsAdmin } from '../useSpaceMembers'

jest.mock('@safe-global/store/gateway/AUTO_GENERATED/spaces', () => ({
  ...jest.requireActual('@safe-global/store/gateway/AUTO_GENERATED/spaces'),
  useSpaceSafesGetV1Query: jest.fn(),
}))
jest.mock('../useCurrentSpaceId', () => ({ useCurrentSpaceId: jest.fn() }))
jest.mock('../useSpaceMembers', () => ({ useIsAdmin: jest.fn() }))

const WORKSPACE_SAFE = '0x1111111111111111111111111111111111111111'
const OUTSIDE_SAFE = '0x2222222222222222222222222222222222222222'
const WORKSPACE_CHAIN = '1'
const OTHER_CHAIN = '137'

const setup = ({ isAdmin = false } = {}) => {
  ;(useIsAdmin as jest.Mock).mockReturnValue(isAdmin)
  ;(useCurrentSpaceId as jest.Mock).mockReturnValue('space-uuid')
  ;(useSpaceSafesGetV1Query as jest.Mock).mockReturnValue({
    currentData: { safes: { [WORKSPACE_CHAIN]: [WORKSPACE_SAFE] } },
  })
}

describe('useAddressBookWriteScope', () => {
  beforeEach(() => jest.clearAllMocks())

  describe('canRename — who may rename', () => {
    it('blocks a member renaming a Safe the workspace owns', () => {
      setup({ isAdmin: false })
      const { result } = renderHook(() => useAddressBookWriteScope(WORKSPACE_SAFE, [WORKSPACE_CHAIN]))
      expect(result.current.canRename).toBe(false)
    })

    it('lets a member rename a Safe outside the workspace', () => {
      setup({ isAdmin: false })
      const { result } = renderHook(() => useAddressBookWriteScope(OUTSIDE_SAFE, [WORKSPACE_CHAIN]))
      expect(result.current.canRename).toBe(true)
    })

    it('lets an admin rename a Safe the workspace owns', () => {
      setup({ isAdmin: true })
      const { result } = renderHook(() => useAddressBookWriteScope(WORKSPACE_SAFE, [WORKSPACE_CHAIN]))
      expect(result.current.canRename).toBe(true)
    })

    it('matches the workspace Safe regardless of address casing', () => {
      setup({ isAdmin: false })
      const { result } = renderHook(() =>
        useAddressBookWriteScope(WORKSPACE_SAFE.toUpperCase().replace('0X', '0x'), [WORKSPACE_CHAIN]),
      )
      expect(result.current.canRename).toBe(false)
    })

    it('lets a member rename the same address on a chain the workspace does not hold', () => {
      setup({ isAdmin: false })
      const { result } = renderHook(() => useAddressBookWriteScope(WORKSPACE_SAFE, [OTHER_CHAIN]))
      expect(result.current.canRename).toBe(true)
    })

    it('allows the rename while the space query has no data yet', () => {
      setup({ isAdmin: false })
      ;(useSpaceSafesGetV1Query as jest.Mock).mockReturnValue({ currentData: undefined })
      const { result } = renderHook(() => useAddressBookWriteScope(WORKSPACE_SAFE, [WORKSPACE_CHAIN]))
      expect(result.current).toEqual({ scope: 'local', canRename: true })
    })
  })

  describe('scope — where the write lands', () => {
    it('is workspace for an admin renaming a Safe the workspace owns', () => {
      setup({ isAdmin: true })
      const { result } = renderHook(() => useAddressBookWriteScope(WORKSPACE_SAFE, [WORKSPACE_CHAIN]))
      expect(result.current.scope).toBe('workspace')
    })

    it('is local for an admin renaming an address outside the workspace', () => {
      setup({ isAdmin: true })
      const { result } = renderHook(() => useAddressBookWriteScope(OUTSIDE_SAFE, [WORKSPACE_CHAIN]))
      expect(result.current.scope).toBe('local')
    })

    it('is local for an admin when only the address matches and the chain does not', () => {
      setup({ isAdmin: true })
      const { result } = renderHook(() => useAddressBookWriteScope(WORKSPACE_SAFE, [OTHER_CHAIN]))
      expect(result.current.scope).toBe('local')
    })

    it('is workspace for an admin when any of the target chains is in the workspace', () => {
      setup({ isAdmin: true })
      const { result } = renderHook(() => useAddressBookWriteScope(WORKSPACE_SAFE, [OTHER_CHAIN, WORKSPACE_CHAIN]))
      expect(result.current.scope).toBe('workspace')
    })

    it('is local for a member', () => {
      setup({ isAdmin: false })
      const { result } = renderHook(() => useAddressBookWriteScope(WORKSPACE_SAFE, [WORKSPACE_CHAIN]))
      expect(result.current.scope).toBe('local')
    })
  })
})
