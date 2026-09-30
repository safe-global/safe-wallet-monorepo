import { act } from '@testing-library/react'
import { renderHook } from '@/tests/test-utils'
import { useAppSelector } from '@/store'
import { selectLandingSpaceHint } from '@/store/authSlice'
import { useRememberSpace } from '../useRememberSpace'

const SPACE_ID = '11111111-1111-1111-1111-111111111111'
const OTHER_SPACE_ID = '22222222-2222-2222-2222-222222222222'

const setVisibility = (state: DocumentVisibilityState) => {
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => state })
  document.dispatchEvent(new Event('visibilitychange'))
}

const authState = {
  auth: {
    sessionExpiresAt: null,
    landingSpaceHint: OTHER_SPACE_ID,
    isStoreHydrated: true,
    cfSafeSynced: false,
    isOidcLoginPending: false,
    isSessionCheckPending: false,
  },
}

/** Renders the hook and returns the stored hint, as the rest of the app reads it. */
const renderRemember = (query: Record<string, string>) =>
  renderHook(
    () => {
      useRememberSpace()
      return useAppSelector(selectLandingSpaceHint)
    },
    { initialReduxState: authState, routerProps: { query } },
  )

describe('useRememberSpace', () => {
  beforeEach(() => {
    window.localStorage.clear()
    setVisibility('visible')
  })

  it('stores the Workspace of the URL', () => {
    const { result } = renderRemember({ spaceId: SPACE_ID })

    expect(result.current).toBe(SPACE_ID)
  })

  it('keeps the previous hint for a legacy numeric id, which the Workspace list cannot match', () => {
    const { result } = renderRemember({ spaceId: '12' })

    expect(result.current).toBe(OTHER_SPACE_ID)
  })

  it('stores nothing outside a Workspace', () => {
    const { result } = renderRemember({})

    expect(result.current).toBe(OTHER_SPACE_ID)
  })

  it('stores nothing while the tab is hidden', () => {
    setVisibility('hidden')

    const { result } = renderRemember({ spaceId: SPACE_ID })

    expect(result.current).toBe(OTHER_SPACE_ID)
  })

  it('stores the Workspace when a hidden tab becomes visible, so the last active tab wins', () => {
    setVisibility('hidden')
    const { result } = renderRemember({ spaceId: SPACE_ID })

    act(() => setVisibility('visible'))

    expect(result.current).toBe(SPACE_ID)
  })
})
