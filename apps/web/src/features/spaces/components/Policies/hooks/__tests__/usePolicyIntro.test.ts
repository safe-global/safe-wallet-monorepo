import { act, renderHook } from '@/tests/test-utils'
import useLocalStorage from '@/services/local-storage/useLocalStorage'
import { usePolicyIntro } from '../usePolicyIntro'

jest.mock('@/services/local-storage/useLocalStorage', () => ({ __esModule: true, default: jest.fn() }))

const mockUseLocalStorage = jest.mocked(useLocalStorage)
const SEEN_KEY = 'somePolicyIntroSeen'

const renderIntro = (hasSeen: boolean | undefined) => {
  const setHasSeen = jest.fn()
  mockUseLocalStorage.mockReturnValue([hasSeen, setHasSeen])
  const startFlow = jest.fn()
  const { result } = renderHook(() => usePolicyIntro(SEEN_KEY, startFlow))
  return { result, startFlow, setHasSeen }
}

describe('usePolicyIntro', () => {
  beforeEach(() => jest.clearAllMocks())

  it('remembers the intro under the given key', () => {
    renderIntro(false)

    expect(mockUseLocalStorage).toHaveBeenCalledWith(SEEN_KEY)
  })

  it('opens the intro, not the flow, until it has been seen', () => {
    const { result, startFlow } = renderIntro(undefined)

    act(() => result.current.request())

    expect(result.current.isOpen).toBe(true)
    expect(startFlow).not.toHaveBeenCalled()
  })

  it('starts the flow directly once the intro has been seen', () => {
    const { result, startFlow } = renderIntro(true)

    act(() => result.current.request())

    expect(result.current.isOpen).toBe(false)
    expect(startFlow).toHaveBeenCalledTimes(1)
  })

  it('closes the intro, records it as seen and starts the flow on proceed', () => {
    const { result, startFlow, setHasSeen } = renderIntro(false)
    act(() => result.current.request())

    act(() => result.current.proceed())

    expect(result.current.isOpen).toBe(false)
    expect(setHasSeen).toHaveBeenCalledWith(true)
    expect(startFlow).toHaveBeenCalledTimes(1)
  })

  it('records the intro as seen when it is dismissed, without starting the flow', () => {
    const { result, startFlow, setHasSeen } = renderIntro(false)
    act(() => result.current.request())

    act(() => result.current.onOpenChange(false))

    expect(result.current.isOpen).toBe(false)
    expect(setHasSeen).toHaveBeenCalledWith(true)
    expect(startFlow).not.toHaveBeenCalled()
  })
})
