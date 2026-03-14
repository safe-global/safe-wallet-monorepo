/**
 * Shim for `next/link` — renders react-router-dom `<Link>` for internal
 * routes and plain `<a>` for external URLs.
 *
 * Supports:
 * - `href` as string or `{ pathname, query }` object
 * - `passHref` + `legacyBehavior`: clones the single child with the resolved href
 * - `replace` navigation
 * - MUI `component={NextLink}` pattern (forwards ref)
 */
import {
  forwardRef,
  cloneElement,
  isValidElement,
  type ReactNode,
  type CSSProperties,
  type MouseEventHandler,
  type AnchorHTMLAttributes,
} from 'react'
import { Link as RouterLink } from 'react-router-dom'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type UrlObject = {
  pathname?: string
  query?: Record<string, string | string[] | undefined>
  hash?: string
}

type Href = string | UrlObject

export interface LinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  href: Href
  as?: string
  replace?: boolean
  scroll?: boolean
  shallow?: boolean
  passHref?: boolean
  prefetch?: boolean
  locale?: string | false
  legacyBehavior?: boolean
  children?: ReactNode
  className?: string
  style?: CSSProperties
  onClick?: MouseEventHandler<HTMLAnchorElement>
}

// Re-export so `import type { LinkProps } from 'next/link'` works.
export type { Href }

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function resolveHref(href: Href): string {
  if (typeof href === 'string') return href

  const { pathname = '/', query, hash } = href
  const params = new URLSearchParams()

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined) continue
      if (Array.isArray(value)) {
        for (const v of value) params.append(key, v)
      } else {
        params.set(key, value)
      }
    }
  }

  const search = params.toString()
  const hashStr = hash ? `#${hash}` : ''
  return `${pathname}${search ? '?' + search : ''}${hashStr}`
}

const EXTERNAL_RE = /^(https?:)?\/\//

function isExternal(href: string): boolean {
  return EXTERNAL_RE.test(href) || href.startsWith('mailto:') || href.startsWith('tel:')
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const NextLink = forwardRef<HTMLAnchorElement, LinkProps>(function NextLink(
  {
    href,
    as: _as,
    replace: replaceProp = false,
    scroll: _scroll,
    shallow: _shallow,
    passHref: _passHref,
    prefetch: _prefetch,
    locale: _locale,
    legacyBehavior = false,
    children,
    ...rest
  },
  ref,
) {
  const resolved = resolveHref(href)

  // legacyBehavior: clone the single child element with the href prop
  // (used with MUI Link / MUI Button as child)
  if (legacyBehavior && isValidElement<Record<string, unknown>>(children)) {
    const childProps: Record<string, unknown> = { href: resolved }
    if (ref) childProps.ref = ref
    if (rest.onClick) childProps.onClick = rest.onClick
    return cloneElement(children, childProps)
  }

  if (isExternal(resolved)) {
    return (
      <a ref={ref} href={resolved} {...rest}>
        {children}
      </a>
    )
  }

  return (
    <RouterLink ref={ref} to={resolved} replace={replaceProp} {...rest}>
      {children}
    </RouterLink>
  )
})

export default NextLink
