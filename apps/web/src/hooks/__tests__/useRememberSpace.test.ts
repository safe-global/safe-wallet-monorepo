import { renderHook } from '@testing-library/react'
import { useRouter } from 'next/compat/router'
import { useRememberSpace } from '../useRememberSpace'

const SPACE_ID = '11111111-1111-1111-1111-111111111111'

jest.mock('next/compat/router', () => ({ useRouter: jest.fn() }))

const mockDispatch = jest.fn()
let mockIsStoreHydrated = true
jest.mock('@/store', () => ({
  useAppDispatch: () => mockDispatch,
  useAppSelector: () => mockIsStoreHydrated,
}))

const rememberAction = { type: 'auth/setLastUsedSpace', payload: SPACE_ID }

const setVisibility = (state: DocumentVisibilityState) => {
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => state })
  document.dispatchEvent(new Event('visibilitychange'))
}

const renderWithQuery = (query: Record<string, string>) => {
  ;(useRouter as jest.Mock).mockReturnValue({ query })
  return renderHook(() => useRememberSpace())
}

describe('useRememberSpace', () => {
  beforeEach(() => {
    mockIsStoreHydrated = true
    setVisibility('visible')
    mockDispatch.mockClear()
  })

  it('stores the Workspace of the URL', () => {
    renderWithQuery({ spaceId: SPACE_ID })

    expect(mockDispatch).toHaveBeenCalledWith(rememberAction)
  })

  it('stores it again when the tab becomes visible, so the last active tab wins', () => {
    renderWithQuery({ spaceId: SPACE_ID })
    setVisibility('hidden')
    mockDispatch.mockClear()

    setVisibility('visible')

    expect(mockDispatch).toHaveBeenCalledWith(rememberAction)
  })

  it('stores nothing while the tab is hidden', () => {
    renderWithQuery({ spaceId: SPACE_ID })
    mockDispatch.mockClear()

    setVisibility('hidden')

    expect(mockDispatch).not.toHaveBeenCalled()
  })

  it('stores nothing outside a Workspace', () => {
    renderWithQuery({})

    expect(mockDispatch).not.toHaveBeenCalled()
  })

  it('waits for the store to hydrate, so the persisted value does not overwrite it', () => {
    mockIsStoreHydrated = false

    renderWithQuery({ spaceId: SPACE_ID })

    expect(mockDispatch).not.toHaveBeenCalled()
  })
})
