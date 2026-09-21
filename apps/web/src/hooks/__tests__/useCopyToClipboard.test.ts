import { renderHook, act } from '@/tests/test-utils'
import useCopyToClipboard from '../useCopyToClipboard'
import { logError } from '@/services/exceptions'

jest.mock('@/services/exceptions', () => ({
  ...jest.requireActual('@/services/exceptions'),
  logError: jest.fn(),
}))

describe('useCopyToClipboard', () => {
  const writeText = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    Object.assign(navigator, { clipboard: { writeText } })
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  it('writes to the clipboard and flips `copied`, then auto-resets', async () => {
    writeText.mockResolvedValue(undefined)
    const { result } = renderHook(() => useCopyToClipboard(2000))

    await act(async () => {
      await result.current.copy('0xABC')
    })

    expect(writeText).toHaveBeenCalledWith('0xABC')
    expect(result.current.copied).toBe(true)

    act(() => {
      jest.advanceTimersByTime(2000)
    })
    expect(result.current.copied).toBe(false)
  })

  it('logs and leaves `copied` false when the clipboard write rejects', async () => {
    const error = new Error('denied')
    writeText.mockRejectedValue(error)
    const { result } = renderHook(() => useCopyToClipboard())

    await act(async () => {
      await result.current.copy('0xABC')
    })

    expect(result.current.copied).toBe(false)
    expect(logError).toHaveBeenCalledWith(expect.anything(), error)
  })
})
