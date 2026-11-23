import { act, renderHook } from '@/tests/test-utils'
import type { TourStep } from '../../types'
import { useTourNavigation } from '../useTourNavigation'

jest.mock('../../../../public/hooks/useCurrentSpaceId', () => ({ useCurrentSpaceId: () => '1' }))

const stepFixture = (id: string, route = '/spaces'): TourStep => ({
  id,
  route,
  anchor: `#${id}`,
  placement: { side: 'bottom', align: 'start' },
  title: id,
  body: id,
})

const STEPS = [stepFixture('first'), stepFixture('second'), stepFixture('third', '/spaces/address-book')]

const renderNavigation = () => {
  const push = jest.fn(() => Promise.resolve(true))
  const hook = renderHook(() => useTourNavigation(STEPS), { routerProps: { pathname: '/spaces', push } })
  return { ...hook, push }
}

describe('useTourNavigation', () => {
  it('starts on the welcome card', () => {
    const { result } = renderNavigation()

    expect(result.current.isWelcome).toBe(true)
    expect(result.current.step).toBeUndefined()
  })

  it('walks every step and then reaches the done card', () => {
    const { result } = renderNavigation()

    act(() => result.current.next())
    expect(result.current.step.id).toBe('first')
    expect(result.current.progress).toEqual({ current: 1, total: 3 })

    act(() => result.current.next())
    act(() => result.current.next())
    act(() => result.current.next())
    expect(result.current.isDone).toBe(true)
  })

  it('returns to the welcome card when going back from the first step', () => {
    const { result } = renderNavigation()

    act(() => result.current.next())
    act(() => result.current.back())

    expect(result.current.isWelcome).toBe(true)
  })

  it('skips forward when the user was moving forward', () => {
    const { result } = renderNavigation()

    act(() => result.current.next())
    act(() => result.current.skip())

    expect(result.current.step.id).toBe('second')
  })

  it('skips backward when the user was moving backward', () => {
    const { result } = renderNavigation()

    act(() => result.current.next())
    act(() => result.current.next())
    act(() => result.current.next())
    act(() => result.current.back())
    act(() => result.current.skip())

    expect(result.current.step.id).toBe('first')
  })

  it('stays on the page when the next step is on the current one', () => {
    const { result, push } = renderNavigation()

    act(() => result.current.next())
    act(() => result.current.next())

    expect(push).not.toHaveBeenCalled()
  })

  it('opens the next step page once when that step is on another page', () => {
    const { result, push } = renderNavigation()

    act(() => result.current.next())
    act(() => result.current.next())
    act(() => result.current.next())

    expect(push).toHaveBeenCalledTimes(1)
    expect(push).toHaveBeenCalledWith({ pathname: '/spaces/address-book', query: { spaceId: '1' } })
  })
})
