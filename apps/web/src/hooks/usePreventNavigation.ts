import { useEffect, useRef } from 'react'
import { useRouter } from 'next/router'

/**
 * Blocks in-app navigation while a guard says so.
 *
 * `onNavigate` decides synchronously — `preventDefault`/`stopImmediatePropagation` on a `mousedown`
 * and a `false` from `beforePopState` are both only honoured in the same tick, so the guard cannot
 * await a user's answer. It instead returns `false` to block now and receives `proceed`, the
 * navigation it blocked, to run later once the user has confirmed.
 */
export function usePreventNavigation(onNavigate?: (proceed: () => void) => boolean): void {
  const router = useRouter()
  const currentPathRef = useRef(router.asPath)

  // Sync current path ref with router
  useEffect(() => {
    const delay = setTimeout(() => {
      currentPathRef.current = router.asPath
    }, 300)
    return () => {
      clearTimeout(delay)
    }
  }, [router.asPath])

  useEffect(() => {
    if (!onNavigate) return

    const onLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const link = target.closest('a')
      const href = link?.getAttribute('href')
      const targetAttr = link?.getAttribute('target')

      if (!link || !href || targetAttr?.toLowerCase() === '_blank') return

      const proceed = () => {
        router.push(href)
      }

      if (onNavigate(proceed)) {
        proceed()
      } else {
        e.preventDefault()
        e.stopImmediatePropagation()
        e.stopPropagation()
      }
    }

    document.addEventListener('mousedown', onLinkClick)

    return () => {
      document.removeEventListener('mousedown', onLinkClick)
    }
  }, [router, onNavigate])

  // Prevent Back/Forward navigation
  useEffect(() => {
    router.beforePopState(({ url }) => {
      const prevUrl = currentPathRef.current
      if (onNavigate) {
        // popstate has already changed the URL, so blocking means rewinding to `prevUrl`; the
        // parked `proceed` replays the destination the user actually asked for.
        const isAllowedToNavigate = onNavigate(() => {
          router.push(url)
        })

        if (!isAllowedToNavigate) {
          // Cancel navigation and reset the URL back
          router.replace(prevUrl)
          return false
        }
      }
      return true
    })

    return () => router.beforePopState(() => true)
  }, [router, onNavigate])
}
