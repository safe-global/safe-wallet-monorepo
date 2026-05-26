import { useEffect, useState } from 'react'

// Matches Tailwind's default `xl` breakpoint (1280px). The onboarding side
// panel is `hidden xl:flex`, so consumers below `xl` should skip any balance
// query that only feeds the (invisible) mockup.
const XL_QUERY = '(min-width: 1280px)'

export function useIsXlViewport(): boolean {
  const [isXl, setIsXl] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mql = window.matchMedia(XL_QUERY)
    setIsXl(mql.matches)
    const onChange = (e: MediaQueryListEvent) => setIsXl(e.matches)
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [])

  return isXl
}
