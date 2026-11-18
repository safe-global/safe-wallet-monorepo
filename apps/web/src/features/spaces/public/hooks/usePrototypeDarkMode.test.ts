import { act, renderHook } from '@/tests/test-utils'
import { usePrototypeDarkMode } from './usePrototypeDarkMode'

describe('usePrototypeDarkMode', () => {
  beforeEach(() => {
    window.localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
    window.history.replaceState(null, '', '/prototypes/pending-queue')
  })

  it('starts light and applies the theme when toggled', () => {
    const { result } = renderHook(() => usePrototypeDarkMode())
    expect(result.current[0]).toBe(false)
    expect(document.documentElement.dataset.theme).toBe('light')

    act(() => result.current[1](true))

    expect(result.current[0]).toBe(true)
    expect(document.documentElement.dataset.theme).toBe('dark')
  })

  it('takes the theme from a ?theme=dark link', () => {
    window.history.replaceState(null, '', '/prototypes/pending-queue?theme=dark')
    const { result } = renderHook(() => usePrototypeDarkMode())
    expect(result.current[0]).toBe(true)
    expect(document.documentElement.dataset.theme).toBe('dark')
  })
})
