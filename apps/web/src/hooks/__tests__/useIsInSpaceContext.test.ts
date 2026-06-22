import { renderHook } from '@testing-library/react'
import { useIsInSpaceContext } from '../useIsInSpaceContext'

const mockIsQualifiedSafe = jest.fn()
const mockIsSpaceRoute = jest.fn()

jest.mock('@/features/spaces', () => ({
  __esModule: true,
  useIsQualifiedSafe: () => mockIsQualifiedSafe(),
}))
jest.mock('@/hooks/useIsSpaceRoute', () => ({
  __esModule: true,
  useIsSpaceRoute: () => mockIsSpaceRoute(),
}))

describe('useIsInSpaceContext', () => {
  it.each([
    [true, false, true],
    [false, true, true],
    [true, true, true],
    [false, false, false],
  ])('qualifiedSafe=%s, spaceRoute=%s -> %s', (qualified, route, expected) => {
    mockIsQualifiedSafe.mockReturnValue(qualified)
    mockIsSpaceRoute.mockReturnValue(route)
    const { result } = renderHook(() => useIsInSpaceContext())
    expect(result.current).toBe(expected)
  })
})
