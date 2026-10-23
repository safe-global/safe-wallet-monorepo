import { skipToken } from '@reduxjs/toolkit/query'
import { renderHook } from '@/tests/test-utils'
import type { RootState } from '@/store'
import { useSafeWorkspacePicker } from '../useSafeWorkspacePicker'

const SPACE_A = '11111111-1111-1111-1111-111111111111'
const SPACE_B = '22222222-2222-2222-2222-222222222222'
const SAFE_ADDRESS = '0x000000000000000000000000000000000000abcd'

const mockAllSpaceSafes = jest.fn()
const mockAllEntitlements = jest.fn()
jest.mock('@safe-global/store/gateway/AUTO_GENERATED/spaces', () => ({
  ...jest.requireActual('@safe-global/store/gateway/AUTO_GENERATED/spaces'),
  useSpaceSafesGetAllV1Query: (arg: unknown) => mockAllSpaceSafes(arg),
}))
jest.mock('@safe-global/store/gateway/AUTO_GENERATED/entitlements', () => ({
  ...jest.requireActual('@safe-global/store/gateway/AUTO_GENERATED/entitlements'),
  useEntitlementsGetAllEntitlementsV1Query: (arg: unknown) => mockAllEntitlements(arg),
}))
let mockIsSafePro = false
jest.mock('@/hooks/useIsSafeProEnabled', () => ({ useIsSafeProEnabled: () => mockIsSafePro }))

const signedIn = {
  auth: {
    sessionExpiresAt: Date.now() + 60_000,
    landingSpaceHint: null,
    isStoreHydrated: true,
    cfSafeSynced: false,
    isOidcLoginPending: false,
    isSessionCheckPending: false,
  },
} as Partial<RootState>
const signedOut = { auth: { ...signedIn.auth, sessionExpiresAt: null } } as Partial<RootState>

const plan = { id: 'business', name: 'Business', cycleEndsAt: null, status: 'active' }

const pick = (enabled = true, initialReduxState: Partial<RootState> = signedIn) =>
  renderHook(() => useSafeWorkspacePicker(enabled), { initialReduxState }).result.current('1', SAFE_ADDRESS)

describe('useSafeWorkspacePicker', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockIsSafePro = false
    mockAllSpaceSafes.mockReturnValue({
      currentData: [
        { spaceUuid: SPACE_A, safes: { '1': ['0x000000000000000000000000000000000000ABCD'] } },
        { spaceUuid: SPACE_B, safes: { '137': [SAFE_ADDRESS] } },
      ],
      isLoading: false,
    })
    mockAllEntitlements.mockReturnValue({ currentData: undefined, isLoading: false })
  })

  it('picks the only Workspace that holds the Safe on its chain, in any address case', () => {
    expect(pick()).toEqual({ kind: 'one', spaceId: SPACE_A })
  })

  it('finds no Workspace when none holds the Safe', () => {
    mockAllSpaceSafes.mockReturnValue({ currentData: [], isLoading: false })

    expect(pick()).toEqual({ kind: 'none' })
  })

  it('picks the only Workspace with a plan under Safe Pro', () => {
    mockIsSafePro = true
    mockAllSpaceSafes.mockReturnValue({
      currentData: [SPACE_A, SPACE_B].map((spaceUuid) => ({ spaceUuid, safes: { '1': [SAFE_ADDRESS] } })),
      isLoading: false,
    })
    mockAllEntitlements.mockReturnValue({
      currentData: { [SPACE_A]: { plan: null, entitlements: [] }, [SPACE_B]: { plan, entitlements: [] } },
      isLoading: false,
    })

    expect(pick()).toEqual({ kind: 'one', spaceId: SPACE_B })
  })

  it('reads the entitlements only under Safe Pro', () => {
    pick()

    expect(mockAllEntitlements).toHaveBeenLastCalledWith(skipToken)
  })

  it.each([
    ['the Safes load', () => mockAllSpaceSafes.mockReturnValue({ currentData: undefined, isLoading: true })],
    ['the entitlements load', () => mockAllEntitlements.mockReturnValue({ currentData: undefined, isLoading: true })],
  ])('waits while %s', (_, arrange) => {
    arrange()

    expect(pick()).toBeUndefined()
  })

  it('skips the requests and picks nothing when disabled', () => {
    expect(pick(false)).toBeUndefined()
    expect(mockAllSpaceSafes).toHaveBeenLastCalledWith(skipToken)
  })

  it('skips the requests and picks nothing for a signed-out user', () => {
    expect(pick(true, signedOut)).toBeUndefined()
    expect(mockAllSpaceSafes).toHaveBeenLastCalledWith(skipToken)
  })
})
