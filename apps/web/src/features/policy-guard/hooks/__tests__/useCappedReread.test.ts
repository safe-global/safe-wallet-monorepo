import { POLLING_INTERVAL } from '@/config/constants'
import { act, renderHook } from '@/tests/test-utils'
import { useCappedReread } from '../useCappedReread'

type Props = { shouldReread: boolean; readKey: string; maxRereads?: number }

const setup = (initialProps: Props) => {
  const refetch = jest.fn()
  const hook = renderHook(
    ({ shouldReread, readKey, maxRereads }: Props) => useCappedReread(shouldReread, readKey, refetch, maxRereads),
    { initialProps },
  )
  const tick = (times = 1) => {
    for (let i = 0; i < times; i++) act(() => jest.advanceTimersByTime(POLLING_INTERVAL))
  }
  return { ...hook, refetch, tick }
}

describe('useCappedReread', () => {
  beforeEach(() => jest.useFakeTimers())
  afterEach(() => jest.useRealTimers())

  it('refetches one polling interval after a re-read is needed', () => {
    const { refetch } = setup({ shouldReread: true, readKey: 'a' })
    act(() => jest.advanceTimersByTime(POLLING_INTERVAL - 1))
    expect(refetch).not.toHaveBeenCalled()
    act(() => jest.advanceTimersByTime(1))
    expect(refetch).toHaveBeenCalledTimes(1)
  })

  it('does not refetch while no re-read is needed', () => {
    const { refetch, tick } = setup({ shouldReread: false, readKey: 'a' })
    tick(3)
    expect(refetch).not.toHaveBeenCalled()
  })

  it('stops after three refetches for the same read key', () => {
    const { refetch, tick } = setup({ shouldReread: true, readKey: 'a' })
    tick(5)
    expect(refetch).toHaveBeenCalledTimes(3)
  })

  it('stops after the given number of refetches', () => {
    const { refetch, tick } = setup({ shouldReread: true, readKey: 'a', maxRereads: 1 })
    tick(3)
    expect(refetch).toHaveBeenCalledTimes(1)
  })

  it('starts counting again for a new read key', () => {
    const { refetch, tick, rerender } = setup({ shouldReread: true, readKey: 'a' })
    tick(4)
    rerender({ shouldReread: true, readKey: 'b' })
    tick(4)
    expect(refetch).toHaveBeenCalledTimes(6)
  })

  it('cancels a pending refetch once the re-read is no longer needed', () => {
    const { refetch, tick, rerender } = setup({ shouldReread: true, readKey: 'a' })
    act(() => jest.advanceTimersByTime(POLLING_INTERVAL / 2))
    rerender({ shouldReread: false, readKey: 'a' })
    tick(2)
    expect(refetch).not.toHaveBeenCalled()
  })

  it('cancels a pending refetch on unmount', () => {
    const { refetch, tick, unmount } = setup({ shouldReread: true, readKey: 'a' })
    unmount()
    tick(2)
    expect(refetch).not.toHaveBeenCalled()
  })
})
