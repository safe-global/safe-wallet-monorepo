import { useRef, useEffect } from 'react'
import { useRouter } from 'next/router'

export function usePreventNavigation(onNavigate?: () => boolean): void {
  const router = useRouter()
  const previousPath = useRef(router.asPath)
  const isRedirecting = useRef(false)
  const { asPath, replace } = router

  useEffect(() => {
    const previousRoute = previousPath.current
    if (asPath === previousRoute) return
    previousPath.current = asPath

    if (isRedirecting.current) {
      isRedirecting.current = false
      return
    }

    if (!onNavigate) return
    const allowNavigation = onNavigate()

    if (!allowNavigation) {
      isRedirecting.current = true
      replace(previousRoute, undefined, { shallow: true })
    }
  }, [replace, asPath, onNavigate])

  useEffect(() => {
    if (!onNavigate) return

    const onLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const link = target.closest('a')
      if (!link || !link.getAttribute('href')) return
      if (onNavigate()) return
      e.preventDefault()
      e.stopImmediatePropagation()
      e.stopPropagation()
    }

    document.addEventListener('mousedown', onLinkClick)

    return () => {
      document.removeEventListener('mousedown', onLinkClick)
    }
  }, [onNavigate])
}
