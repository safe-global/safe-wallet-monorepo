/**
 * Compatibility shim for `next/link`, wrapping `<a>` with TanStack Router's
 * history-aware navigation. The `passHref`, `legacyBehavior`, `prefetch`,
 * `scroll`, and `shallow` props are accepted and ignored — apps/web/src/pages/
 * 403.tsx and a handful of others rely on `passHref legacyBehavior`, which is
 * preserved here by always forwarding `href` to the child anchor (or the cloned
 * child when `legacyBehavior` is set).
 */
import { forwardRef, cloneElement, isValidElement } from 'react'
import type { AnchorHTMLAttributes, MouseEvent, ReactElement, ReactNode } from 'react'
import type { UrlObject } from 'url'
import { useNavigate } from '@tanstack/react-router'
import { toHref, toNavigateOptions } from './next-url'

export type LinkProps = {
  href: string | UrlObject
  as?: string | UrlObject
  replace?: boolean
  scroll?: boolean
  shallow?: boolean
  passHref?: boolean
  prefetch?: boolean
  legacyBehavior?: boolean
  locale?: string | false
  children?: ReactNode
} & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>

const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link(
  {
    href,
    as: _as,
    replace,
    scroll: _scroll,
    shallow: _shallow,
    passHref: _passHref,
    prefetch: _prefetch,
    legacyBehavior,
    locale: _locale,
    children,
    onClick,
    target,
    ...rest
  },
  ref,
) {
  const navigate = useNavigate()
  const hrefStr = toHref(href)

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event)
    if (event.defaultPrevented) return
    if (target && target !== '_self') return
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return
    if (/^https?:|^mailto:|^tel:/i.test(hrefStr)) return
    event.preventDefault()
    void navigate({ ...toNavigateOptions(href), replace })
  }

  if (legacyBehavior && isValidElement(children)) {
    const child = children as ReactElement<AnchorHTMLAttributes<HTMLAnchorElement>>
    return cloneElement(child, {
      ...child.props,
      href: hrefStr,
      onClick: (event: MouseEvent<HTMLAnchorElement>) => {
        child.props.onClick?.(event)
        handleClick(event)
      },
    } as Partial<AnchorHTMLAttributes<HTMLAnchorElement>>)
  }

  return (
    <a {...rest} ref={ref} href={hrefStr} target={target} onClick={handleClick}>
      {children}
    </a>
  )
})

export default Link
