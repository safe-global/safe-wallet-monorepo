import { renderHook, act } from '@testing-library/react'
import { useSpaceBackLink } from './useSpaceBackLink'

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
import { AppRoutes } from '@/config/routes'

const mockUseRouter = useRouter as jest.Mock
const mockUseCurrentSpaceId = useCurrentSpaceId as jest.Mock
const mockUseSpacesGetOneV1Query = useSpacesGetOneV1Query as jest.Mock
const mockUseAppSelector = useAppSelector as jest.Mock

function setupDefaults(overrides: { spaceId?: string | null; isSignedIn?: boolean; space?: object | null } = {}) {
  mockUseRouter.mockReturnValue({ push: mockPush })
  mockUseCurrentSpaceId.mockReturnValue('spaceId' in overrides ? overrides.spaceId : '42')
  mockUseAppSelector.mockReturnValue(overrides.isSignedIn ?? true)
  mockUseSpacesGetOneV1Query.mockReturnValue({
    currentData: 'space' in overrides ? overrides.space : { id: 42, name: 'Acme Corp' },
  })
}

describe('useSpaceBackLink', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    setupDefaults()
  })

  it('returns space data from the query', () => {
    const { result } = renderHook(() => useSpaceBackLink())

    expect(result.current.space).toEqual({ id: 42, name: 'Acme Corp' })
  })

  it('navigates to the space page when handleBackToSpace is called', () => {
    const { result } = renderHook(() => useSpaceBackLink())

    act(() => {
      result.current.handleBackToSpace()
    })

    expect(mockPush).toHaveBeenCalledWith({
      pathname: AppRoutes.spaces.index,
      query: { spaceId: '42' },
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
      { id: 42 },
      expect.objectContaining({ skip: true }),
    )
  })

  it('skips the query when spaceId is not available', () => {
    setupDefaults({ spaceId: undefined })

    renderHook(() => useSpaceBackLink())

    expect(mockUseSpacesGetOneV1Query).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ skip: true }),
    )
  })

  it('does not skip the query when both signed in and spaceId are available', () => {
    setupDefaults({ spaceId: '10', isSignedIn: true })

    renderHook(() => useSpaceBackLink())

    expect(mockUseSpacesGetOneV1Query).toHaveBeenCalledWith(
      { id: 10 },
      expect.objectContaining({ skip: false }),
    )
  })

  it('returns undefined space when query has no data', () => {
    setupDefaults({ space: undefined })

    const { result } = renderHook(() => useSpaceBackLink())

    expect(result.current.space).toBeUndefined()
  })
})
