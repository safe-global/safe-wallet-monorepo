import type { NextRouter } from 'next/router'
import { faker } from '@faker-js/faker'
import { fireEvent, renderHook } from '@/tests/test-utils'
import { usePreventNavigation } from '../usePreventNavigation'

type PopStateHandler = Parameters<NextRouter['beforePopState']>[0]

const CURRENT_PATH = '/current'
const TARGET_PATH = '/target'

describe('usePreventNavigation', () => {
  const push = jest.fn()
  const replace = jest.fn()
  const beforePopState = jest.fn()
  const elements: HTMLElement[] = []

  const renderGuard = (onNavigate?: (proceed: () => void) => boolean) =>
    renderHook(() => usePreventNavigation(onNavigate), {
      routerProps: { asPath: CURRENT_PATH, push, replace, beforePopState },
    })

  const addElement = (tag: string, attributes: Record<string, string> = {}) => {
    const element = document.createElement(tag)
    Object.entries(attributes).forEach(([name, value]) => element.setAttribute(name, value))
    document.body.appendChild(element)
    elements.push(element)
    return element
  }

  /** Fires a `mousedown` and reports whether a listener cancelled it. */
  const mouseDown = (element: HTMLElement): boolean => !fireEvent.mouseDown(element)

  const getPopStateHandler = () => beforePopState.mock.calls.at(-1)?.[0] as PopStateHandler

  const popState = (url: string) => getPopStateHandler()({ url, as: url, options: {} })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    elements.splice(0).forEach((element) => element.remove())
  })

  describe('link clicks', () => {
    it('routes an allowed navigation exactly once', () => {
      const onNavigate = jest.fn(() => true)
      renderGuard(onNavigate)

      const wasPrevented = mouseDown(addElement('a', { href: TARGET_PATH }))

      expect(onNavigate).toHaveBeenCalledTimes(1)
      expect(push).toHaveBeenCalledTimes(1)
      expect(push).toHaveBeenCalledWith(TARGET_PATH)
      // The guard may close whatever the link lives in, so the anchor must not navigate as well
      expect(wasPrevented).toBe(true)
    })

    it('does not route a blocked navigation until the guard replays it', () => {
      let parked: (() => void) | undefined
      renderGuard((proceed) => {
        parked = proceed
        return false
      })

      const wasPrevented = mouseDown(addElement('a', { href: TARGET_PATH }))

      expect(wasPrevented).toBe(true)
      expect(push).not.toHaveBeenCalled()

      parked?.()

      expect(push).toHaveBeenCalledTimes(1)
      expect(push).toHaveBeenCalledWith(TARGET_PATH)
    })

    it('ignores links that open in a new tab', () => {
      const onNavigate = jest.fn(() => true)
      renderGuard(onNavigate)

      const wasPrevented = mouseDown(addElement('a', { href: TARGET_PATH, target: '_blank' }))

      expect(onNavigate).not.toHaveBeenCalled()
      expect(push).not.toHaveBeenCalled()
      expect(wasPrevented).toBe(false)
    })

    it.each([
      ['a mailto', `mailto:${faker.internet.email()}`],
      ['an external URL', faker.internet.url()],
      ['a hash', '#anchor'],
    ])('ignores %s href', (_, href) => {
      const onNavigate = jest.fn(() => true)
      renderGuard(onNavigate)

      const wasPrevented = mouseDown(addElement('a', { href }))

      expect(onNavigate).not.toHaveBeenCalled()
      expect(push).not.toHaveBeenCalled()
      expect(wasPrevented).toBe(false)
    })

    it('ignores clicks that are not on a link', () => {
      const onNavigate = jest.fn(() => true)
      renderGuard(onNavigate)

      const wasPrevented = mouseDown(addElement('div'))

      expect(onNavigate).not.toHaveBeenCalled()
      expect(wasPrevented).toBe(false)
    })

    it('does nothing without a guard', () => {
      renderGuard(undefined)

      const wasPrevented = mouseDown(addElement('a', { href: TARGET_PATH }))

      expect(push).not.toHaveBeenCalled()
      expect(wasPrevented).toBe(false)
    })
  })

  describe('back/forward', () => {
    it('lets an allowed navigation through untouched', () => {
      renderGuard(() => true)

      expect(popState(TARGET_PATH)).toBe(true)
      // popstate has already moved the URL, so routing again would only add a history entry
      expect(push).not.toHaveBeenCalled()
      expect(replace).not.toHaveBeenCalled()
    })

    it('rewinds a blocked navigation until the guard replays it', () => {
      let parked: (() => void) | undefined
      renderGuard((proceed) => {
        parked = proceed
        return false
      })

      expect(popState(TARGET_PATH)).toBe(false)
      expect(replace).toHaveBeenCalledWith(CURRENT_PATH)
      expect(push).not.toHaveBeenCalled()

      parked?.()

      expect(push).toHaveBeenCalledTimes(1)
      expect(push).toHaveBeenCalledWith(TARGET_PATH)
    })
  })
})
