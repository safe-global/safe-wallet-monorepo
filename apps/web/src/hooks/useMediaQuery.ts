import { useEffect, useState } from 'react'

/**
 * Subscribe to a CSS media query and return whether it currently matches.
 *
 * Drop-in replacement for MUI's `useMediaQuery` for the cases where a specific
 * pixel breakpoint is needed (e.g. the legacy `md` = 899.95px breakpoint that
 * `useIsMobile`'s 768px threshold does not cover).
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(false)

  useEffect(() => {
    const mql = window.matchMedia(query)
    const onChange = () => setMatches(mql.matches)
    onChange()
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [query])

  return matches
}

/** Legacy MUI `theme.breakpoints.down('md')` === `(max-width:899.95px)`. */
export const MD_DOWN_QUERY = '(max-width:899.95px)'

/** True below the `md` breakpoint (matches MUI's `breakpoints.down('md')`). */
export function useIsBelowMd(): boolean {
  return useMediaQuery(MD_DOWN_QUERY)
}

/**
 * Legacy MUI `theme.breakpoints.down('sm')` === `(max-width:599.95px)`.
 *
 * Not the same as `useIsMobile` from `@/hooks/use-mobile`, which is shadcn's stock hook at 768px.
 * Components that were on MUI's `sm` before the migration belong here — 768px would flip their
 * layout 168px earlier than they were designed for.
 */
export const SM_DOWN_QUERY = '(max-width:599.95px)'

/** True below the `sm` breakpoint (matches MUI's `breakpoints.down('sm')`). */
export function useIsBelowSm(): boolean {
  return useMediaQuery(SM_DOWN_QUERY)
}

/** Legacy MUI `theme.breakpoints.up('lg')` === `(min-width:1200px)`. */
export const LG_UP_QUERY = '(min-width:1200px)'

/** True at or above the `lg` breakpoint (matches MUI's `breakpoints.up('lg')`). */
export function useIsAboveLg(): boolean {
  return useMediaQuery(LG_UP_QUERY)
}

export default useMediaQuery
