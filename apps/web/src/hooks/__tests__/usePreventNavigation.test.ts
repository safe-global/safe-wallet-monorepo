import type { NextRouter } from 'next/router'
import { fireEvent, renderHook } from '@/tests/test-utils'
import { usePreventNavigation } from '@/hooks/usePreventNavigation'

type PopStateHandler = Parameters<NextRouter['beforePopState']>[0]
type Guard = (proceed: () => void) => boolean

const CURRENT_PATH = '/current'
const DESTINATION = '/queue'

const appendedLinks: HTMLAnchorElement[] = []

const appendLink = (href: string, target?: string): HTMLAnchorElement => {
  const link = document.createElement('a')
  link.setAttribute('href', href)
  if (target) link.setAttribute('target', target)
  document.body.append(link)
  appendedLinks.push(link)
  return link
}

const renderGuardedHook = (onNavigate?: Guard) => {
  const push = jest.fn(() => Promise.resolve(true))
  const replace = jest.fn(() => Promise.resolve(true))
  let popStateHandler: PopStateHandler | undefined
  const beforePopState = jest.fn((cb: PopStateHandler) => {
    popStateHandler = cb
  })

  const { unmount } = renderHook(() => usePreventNavigation(onNavigate), {
    routerProps: { asPath: CURRENT_PATH, push, replace, beforePopState },
  })

  return {
    push,
    replace,
    unmount,
    popState: (url = DESTINATION) => popStateHandler?.({ url, as: url, options: {} }),
  }
}

/** Parks the `proceed` it is handed so the test can replay the blocked navigation later. */
const blockingGuard = () => {
  let parked: (() => void) | undefined
  const guard = jest.fn((proceed: () => void) => {
    parked = proceed
    return false
  })
  return { guard, replay: () => parked?.() }
}

afterEach(() => {
  appendedLinks.splice(0).forEach((link) => link.remove())
})

describe('usePreventNavigation', () => {
  describe('link clicks', () => {
    it('navigates exactly once when the guard allows', () => {
      const onNavigate = jest.fn(() => true)
      const { push } = renderGuardedHook(onNavigate)

      fireEvent.mouseDown(appendLink(DESTINATION))

      expect(onNavigate).toHaveBeenCalledTimes(1)
      expect(push).toHaveBeenCalledTimes(1)
      expect(push).toHaveBeenCalledWith(DESTINATION)
    })

    it('blocks the click and does not navigate when the guard denies', () => {
      const { guard } = blockingGuard()
      const { push } = renderGuardedHook(guard)

      const defaultAllowed = fireEvent.mouseDown(appendLink(DESTINATION))

      expect(defaultAllowed).toBe(false)
      expect(push).not.toHaveBeenCalled()
    })

    it('navigates exactly once when a blocked click is replayed later', () => {
      const { guard, replay } = blockingGuard()
      const { push } = renderGuardedHook(guard)

      fireEvent.mouseDown(appendLink(DESTINATION))
      expect(push).not.toHaveBeenCalled()

      replay()

      expect(push).toHaveBeenCalledTimes(1)
      expect(push).toHaveBeenCalledWith(DESTINATION)
    })

    it('ignores links that open in a new tab', () => {
      const onNavigate = jest.fn(() => true)
      const { push } = renderGuardedHook(onNavigate)

      const defaultAllowed = fireEvent.mouseDown(appendLink('https://safe.global', '_blank'))

      expect(defaultAllowed).toBe(true)
      expect(onNavigate).not.toHaveBeenCalled()
      expect(push).not.toHaveBeenCalled()
    })

    it('ignores clicks outside of a link', () => {
      const onNavigate = jest.fn(() => true)
      const { push } = renderGuardedHook(onNavigate)

      fireEvent.mouseDown(document.body)

      expect(onNavigate).not.toHaveBeenCalled()
      expect(push).not.toHaveBeenCalled()
    })

    it('does not intercept clicks when no guard is passed', () => {
      const { push } = renderGuardedHook(undefined)

      const defaultAllowed = fireEvent.mouseDown(appendLink(DESTINATION))

      expect(defaultAllowed).toBe(true)
      expect(push).not.toHaveBeenCalled()
    })

    it('stops intercepting clicks after unmount', () => {
      const onNavigate = jest.fn(() => true)
      const { push, unmount } = renderGuardedHook(onNavigate)

      unmount()
      fireEvent.mouseDown(appendLink(DESTINATION))

      expect(onNavigate).not.toHaveBeenCalled()
      expect(push).not.toHaveBeenCalled()
    })
  })

  describe('back/forward navigation', () => {
    it('lets the popstate navigation through without pushing when the guard allows', () => {
      const onNavigate = jest.fn(() => true)
      const { push, replace, popState } = renderGuardedHook(onNavigate)

      expect(popState()).toBe(true)

      expect(onNavigate).toHaveBeenCalledTimes(1)
      // popstate has already navigated; a push on top of it would be the second navigation
      expect(push).not.toHaveBeenCalled()
      expect(replace).not.toHaveBeenCalled()
    })

    it('rewinds to the current path and does not navigate when the guard denies', () => {
      const { guard } = blockingGuard()
      const { push, replace, popState } = renderGuardedHook(guard)

      expect(popState()).toBe(false)

      expect(replace).toHaveBeenCalledTimes(1)
      expect(replace).toHaveBeenCalledWith(CURRENT_PATH)
      expect(push).not.toHaveBeenCalled()
    })

    it('navigates exactly once to the requested URL when a blocked popstate is replayed later', () => {
      const { guard, replay } = blockingGuard()
      const { push, popState } = renderGuardedHook(guard)

      popState()
      expect(push).not.toHaveBeenCalled()

      replay()

      expect(push).toHaveBeenCalledTimes(1)
      expect(push).toHaveBeenCalledWith(DESTINATION)
    })

    it('allows popstate when no guard is passed', () => {
      const { push, replace, popState } = renderGuardedHook(undefined)

      expect(popState()).toBe(true)
      expect(push).not.toHaveBeenCalled()
      expect(replace).not.toHaveBeenCalled()
    })
  })
})
