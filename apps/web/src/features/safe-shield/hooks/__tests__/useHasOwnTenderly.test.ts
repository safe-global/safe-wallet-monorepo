import { renderHook } from '@/tests/test-utils'
import { initialState } from '@/store/settingsSlice'
import { useHasOwnTenderly } from '../useHasOwnTenderly'

const renderWithTenderly = (tenderly: { url: string; accessToken: string }) =>
  renderHook(() => useHasOwnTenderly(), {
    initialReduxState: { settings: { ...initialState, env: { ...initialState.env, tenderly } } },
  })

describe('useHasOwnTenderly', () => {
  it('is true once both the Tenderly URL and access token are set', () => {
    const { result } = renderWithTenderly({ url: 'https://tenderly.example', accessToken: 'token' })
    expect(result.current).toBe(true)
  })

  it('is false while either value is missing', () => {
    expect(renderWithTenderly({ url: 'https://tenderly.example', accessToken: '' }).result.current).toBe(false)
    expect(renderWithTenderly({ url: '', accessToken: 'token' }).result.current).toBe(false)
  })
})
