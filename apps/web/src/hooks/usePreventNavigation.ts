import { useEffect, useRef } from 'react'
import { useRouter } from 'next/router'

export function usePreventNavigation(onNavigate?: () => boolean): void {
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
      if (!link || !href) return

      const isAllowedToNavigate = onNavigate()
      if (isAllowedToNavigate) {
        router.push(href)
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
    router.beforePopState(() => {
      const prevUrl = currentPathRef.current
      if (onNavigate) {
        const isAllowedToNavigate = onNavigate()

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
