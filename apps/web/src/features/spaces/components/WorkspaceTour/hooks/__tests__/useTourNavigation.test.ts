import { act, renderHook } from '@/tests/test-utils'
import type { TourStep } from '../../types'
import { useTourNavigation } from '../useTourNavigation'

const stepFixture = (id: string): TourStep => ({
  id,
  route: '/spaces',
  anchor: `#${id}`,
  placement: { side: 'bottom', align: 'start' },
  title: id,
  body: id,
})

const STEPS = [stepFixture('first'), stepFixture('second'), stepFixture('third')]

describe('useTourNavigation', () => {
  it('starts on the welcome card', () => {
    const { result } = renderHook(() => useTourNavigation(STEPS))

    expect(result.current.isWelcome).toBe(true)
    expect(result.current.step).toBeUndefined()
  })

  it('walks every step and then reaches the done card', () => {
    const { result } = renderHook(() => useTourNavigation(STEPS))

    act(() => result.current.next())
    expect(result.current.step.id).toBe('first')
    expect(result.current.progress).toEqual({ current: 1, total: 3 })

    act(() => result.current.next())
    act(() => result.current.next())
    act(() => result.current.next())
    expect(result.current.isDone).toBe(true)
  })

  it('returns to the welcome card when going back from the first step', () => {
    const { result } = renderHook(() => useTourNavigation(STEPS))

    act(() => result.current.next())
    act(() => result.current.back())

    expect(result.current.isWelcome).toBe(true)
  })

  it('skips forward when the user was moving forward', () => {
    const { result } = renderHook(() => useTourNavigation(STEPS))

    act(() => result.current.next())
    act(() => result.current.skip())

    expect(result.current.step.id).toBe('second')
  })

  it('skips backward when the user was moving backward', () => {
    const { result } = renderHook(() => useTourNavigation(STEPS))

    act(() => result.current.next())
    act(() => result.current.next())
    act(() => result.current.next())
    act(() => result.current.back())
    act(() => result.current.skip())

    expect(result.current.step.id).toBe('first')
  })
})
