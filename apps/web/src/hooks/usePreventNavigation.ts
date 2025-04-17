import { useEffect } from 'react'
import { useRouter } from 'next/router'

export function usePreventNavigation(onNavigate?: () => boolean): void {
  const router = useRouter()
  const { push } = router

  useEffect(() => {
    if (!onNavigate) return

    const onLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const link = target.closest('a')
      const href = link?.getAttribute('href')
      if (!link || !href) return
      if (onNavigate()) {
        push(href)
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
  }, [push, onNavigate])
}
