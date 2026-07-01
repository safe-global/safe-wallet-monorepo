import type { ComponentProps, ReactElement, ReactNode } from 'react'
import Link from 'next/link'
import type { LinkProps } from 'next/link'

import { typographyVariants } from '@/components/ui/typography'
import { cn } from '@/utils/cn'

import css from './styles.module.css'

export const SidebarList = ({ children, className, ...rest }: ComponentProps<'ul'>): ReactElement => (
  <ul className={cn('m-0 list-none px-2 py-2', css.list, className)} {...rest}>
    {children}
  </ul>
)

export const SidebarListItemButton = ({
  href,
  externalUrl,
  children,
  disabled,
  selected,
  className,
  ...rest
}: Omit<ComponentProps<'a'>, 'href'> & {
  href?: LinkProps['href']
  externalUrl?: string
  selected?: boolean
  disabled?: boolean
}): ReactElement => {
  const classes = cn(
    'flex w-full items-center px-3 no-underline',
    css.listItemButton,
    disabled && 'pointer-events-none',
    className,
  )

  if (externalUrl) {
    return (
      <a
        href={externalUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={classes}
        data-selected={selected || undefined}
        {...rest}
      >
        {children}
      </a>
    )
  }

  if (href) {
    return (
      <Link href={href} className={classes} data-selected={selected || undefined} {...rest}>
        {children}
      </Link>
    )
  }

  return (
    <span className={classes} data-selected={selected || undefined} {...rest}>
      {children}
    </span>
  )
}

export const SidebarListItemIcon = ({
  children,
  badge = false,
  className,
}: {
  children: ReactNode
  badge?: boolean
  className?: string
}): ReactElement => (
  <span className={cn('relative mr-2 flex min-w-0 shrink-0 items-center', css.icon, className)}>
    {children}
    {badge && <span className="absolute -right-1 -top-0.5 size-1.5 rounded-full bg-[var(--color-error-main)]" />}
  </span>
)

export const SidebarListItemText = ({
  children,
  bold = false,
  className,
  ...rest
}: ComponentProps<'div'> & { bold?: boolean }): ReactElement => (
  <div
    className={cn(
      typographyVariants({ variant: bold ? 'paragraph-small-bold' : 'paragraph-small' }),
      'flex w-full items-center justify-between',
      className,
    )}
    {...rest}
  >
    {children}
  </div>
)

export const SidebarListItemCounter = ({
  count,
  variant = 'warning',
}: {
  count?: string
  variant?: 'warning' | 'subtle'
}): ReactElement | null =>
  count ? (
    <span
      className={cn(
        'ml-6 inline-flex h-5 min-w-5 items-center justify-center rounded-[10px] px-0.5 align-middle text-[11px] font-bold',
        variant === 'warning'
          ? 'bg-[var(--color-warning-light)] text-[var(--color-static-main)]'
          : 'border border-[var(--color-background-main)] bg-[var(--color-background-main)] text-[var(--color-text-primary)]',
      )}
    >
      {count}
    </span>
  ) : null
