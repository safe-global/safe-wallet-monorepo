import { renderHook } from '@testing-library/react'
import useExistingSpace from './useExistingSpace'

const mockSetValue = jest.fn()

let mockRouterQuery: Record<string, string | undefined> = {}
let mockQueryResult: {
  data: { id: number; name: string } | undefined
  isLoading: boolean
  isFetching: boolean
} = { data: undefined, isLoading: false, isFetching: false }

jest.mock('next/router', () => ({
  useRouter: () => ({ query: mockRouterQuery }),
}))

jest.mock('@safe-global/store/gateway/AUTO_GENERATED/spaces', () => ({
  useSpacesGetOneV1Query: jest.fn(() => mockQueryResult),
}))

import { useSpacesGetOneV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'

const setQueryResult = (result: Partial<typeof mockQueryResult>): void => {
  mockQueryResult = { data: undefined, isLoading: false, isFetching: false, ...result }
}

describe('useExistingSpace', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockRouterQuery = {}
    setQueryResult({})
  })

  it('is not in edit mode and skips the query when the URL has no spaceId', () => {
    const { result } = renderHook(() => useExistingSpace(mockSetValue))

    expect(result.current.spaceId).toBeUndefined()
    expect(result.current.isEditMode).toBe(false)
    expect(result.current.isSpaceLoading).toBe(false)
    expect(useSpacesGetOneV1Query).toHaveBeenCalledWith({ id: NaN }, { skip: true })
  })

  it('is in edit mode and runs the query when the URL carries a spaceId', () => {
    mockRouterQuery = { spaceId: '42' }

    const { result } = renderHook(() => useExistingSpace(mockSetValue))

    expect(result.current.spaceId).toBe('42')
    expect(result.current.isEditMode).toBe(true)
    expect(useSpacesGetOneV1Query).toHaveBeenCalledWith({ id: 42 }, { skip: false })
  })

  it('sets the form name once the existing space resolves', () => {
    mockRouterQuery = { spaceId: '42' }
    setQueryResult({ data: { id: 42, name: 'Treasury Ops' } })

    renderHook(() => useExistingSpace(mockSetValue))

    expect(mockSetValue).toHaveBeenCalledWith('name', 'Treasury Ops', { shouldValidate: true })
  })

  it('does not set the form name when the space has no name yet', () => {
    mockRouterQuery = { spaceId: '42' }
    setQueryResult({ data: undefined })

    renderHook(() => useExistingSpace(mockSetValue))

    expect(mockSetValue).not.toHaveBeenCalled()
  })

  it('reports loading while the space query is in flight in edit mode', () => {
    mockRouterQuery = { spaceId: '42' }
    setQueryResult({ isLoading: true })

    const { result } = renderHook(() => useExistingSpace(mockSetValue))

    expect(result.current.isSpaceLoading).toBe(true)
  })

  it('reports loading while the space query is re-fetching in edit mode', () => {
    mockRouterQuery = { spaceId: '42' }
    setQueryResult({ isFetching: true })

    const { result } = renderHook(() => useExistingSpace(mockSetValue))

    expect(result.current.isSpaceLoading).toBe(true)
  })

  it('is not loading once the query settles in edit mode', () => {
    mockRouterQuery = { spaceId: '42' }
    setQueryResult({ data: { id: 42, name: 'Treasury Ops' } })

    const { result } = renderHook(() => useExistingSpace(mockSetValue))

    expect(result.current.isSpaceLoading).toBe(false)
  })

  it('never reports loading outside edit mode, even if the query flags loading', () => {
    setQueryResult({ isLoading: true, isFetching: true })

    const { result } = renderHook(() => useExistingSpace(mockSetValue))

    expect(result.current.isSpaceLoading).toBe(false)
  })
})
