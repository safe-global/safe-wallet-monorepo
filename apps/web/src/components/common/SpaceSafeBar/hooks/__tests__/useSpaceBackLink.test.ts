import { renderHook, act } from '@testing-library/react'
import { useSpaceBackLink } from '../useSpaceBackLink'

const mockPush = jest.fn()

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}))

jest.mock('@/features/spaces', () => ({
  useCurrentSpaceId: jest.fn(),
}))

jest.mock('@safe-global/store/gateway/AUTO_GENERATED/spaces', () => ({
  useSpacesGetOneV1Query: jest.fn(),
}))

jest.mock('@/store', () => ({
  useAppSelector: jest.fn(),
}))

import { useRouter } from 'next/router'
import { useCurrentSpaceId } from '@/features/spaces'
import { useSpacesGetOneV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useAppSelector } from '@/store'
import { selectLastUsedSpacePath } from '@/features/spaces/store'
import { AppRoutes } from '@/config/routes'
import { spaceBuilder } from '@/tests/builders/space'

const MOCK_SPACE_UUID = '11111111-1111-1111-1111-111111111111'
const MOCK_SPACE_UUID_ALT = '22222222-2222-2222-2222-222222222222'
const mockSpace = spaceBuilder().with({ uuid: MOCK_SPACE_UUID, name: 'Acme Corp' }).build()

const mockUseRouter = useRouter as jest.Mock
const mockUseCurrentSpaceId = useCurrentSpaceId as jest.Mock
const mockUseSpacesGetOneV1Query = useSpacesGetOneV1Query as jest.Mock
const mockUseAppSelector = useAppSelector as jest.Mock

function setupDefaults(
  overrides: { spaceId?: string | null; isSignedIn?: boolean; space?: object | null; originPath?: string | null } = {},
) {
  mockUseRouter.mockReturnValue({ push: mockPush })
  mockUseCurrentSpaceId.mockReturnValue('spaceId' in overrides ? overrides.spaceId : MOCK_SPACE_UUID)
  // The hook reads two selectors: isAuthenticated and selectLastUsedSpacePath — return per-selector.
  mockUseAppSelector.mockImplementation((selector) =>
    selector === selectLastUsedSpacePath ? (overrides.originPath ?? null) : (overrides.isSignedIn ?? true),
  )
  mockUseSpacesGetOneV1Query.mockReturnValue({
    currentData: 'space' in overrides ? overrides.space : mockSpace,
  })
}

describe('useSpaceBackLink', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    setupDefaults()
  })

  it('returns space data from the query', () => {
    const { result } = renderHook(() => useSpaceBackLink())

    expect(result.current.space).toEqual(mockSpace)
  })

  it('falls back to the workspace landing when no origin path is recorded', () => {
    const { result } = renderHook(() => useSpaceBackLink())

    act(() => {
      result.current.handleBackToSpace()
    })

    expect(mockPush).toHaveBeenCalledWith({
      pathname: AppRoutes.spaces.index,
      query: { spaceId: MOCK_SPACE_UUID },
    })
  })

  it('navigates back to the recorded origin space page when set', () => {
    setupDefaults({ originPath: AppRoutes.spaces.security })

    const { result } = renderHook(() => useSpaceBackLink())

    act(() => {
      result.current.handleBackToSpace()
    })

    expect(mockPush).toHaveBeenCalledWith({
      pathname: AppRoutes.spaces.security,
      query: { spaceId: MOCK_SPACE_UUID },
    })
  })

  it('does not navigate when spaceId is undefined', () => {
    setupDefaults({ spaceId: undefined })

    const { result } = renderHook(() => useSpaceBackLink())

    act(() => {
      result.current.handleBackToSpace()
    })

    expect(mockPush).not.toHaveBeenCalled()
  })

  it('skips the query when user is not signed in', () => {
    setupDefaults({ isSignedIn: false })

    renderHook(() => useSpaceBackLink())

    expect(mockUseSpacesGetOneV1Query).toHaveBeenCalledWith(
      { id: MOCK_SPACE_UUID },
      expect.objectContaining({ skip: true }),
    )
  })

  it('skips the query when spaceId is not available', () => {
    setupDefaults({ spaceId: undefined })

    renderHook(() => useSpaceBackLink())

    expect(mockUseSpacesGetOneV1Query).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ skip: true }))
  })

  it('does not skip the query when both signed in and spaceId are available', () => {
    setupDefaults({ spaceId: MOCK_SPACE_UUID_ALT, isSignedIn: true })

    renderHook(() => useSpaceBackLink())

    expect(mockUseSpacesGetOneV1Query).toHaveBeenCalledWith(
      { id: MOCK_SPACE_UUID_ALT },
      expect.objectContaining({ skip: false }),
    )
  })

  it('returns undefined space when query has no data', () => {
    setupDefaults({ space: undefined })

    const { result } = renderHook(() => useSpaceBackLink())

    expect(result.current.space).toBeUndefined()
  })
})
