import { useEffect } from 'react'

const SIDEBAR_COOKIE_NAME = 'sidebar_state'
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7

export function readSidebarCookie(fallback: boolean): boolean {
  if (typeof document === 'undefined') return fallback
  try {
    const match = document.cookie.match(
      new RegExp(`(?:^|; )${SIDEBAR_COOKIE_NAME.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}=([^;]*)`),
    )
    const value = match?.[1]?.trim()
    if (value === 'true') return true
    if (value === 'false') return false
  } catch {
    // ignore - falling back to the default sidebar state
  }
  return fallback
}

export function writeSidebarCookie(open: boolean): void {
  document.cookie = `${SIDEBAR_COOKIE_NAME}=${open}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`
}

/** Calls `toggle` on Cmd/Ctrl + `key` anywhere on the page. */
export function useSidebarShortcut(key: string, toggle: () => void): void {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === key && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        toggle()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [key, toggle])
}
