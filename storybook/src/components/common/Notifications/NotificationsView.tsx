import type { FocusEventHandler, MouseEventHandler, ReactElement, ReactNode, SyntheticEvent } from 'react'
import React from 'react'
import type { LinkProps } from 'next/link'
import NextLink from 'next/link'
import { ChevronRight, X } from 'lucide-react'
import { Alert, AlertAction, AlertDescription, AlertTitle, AlertSeverityIcon } from '@/components/ui/alert'
import { Link } from '@/components/ui/link'
import { Button } from '@/components/ui/button'
import { OVERVIEW_EVENTS } from '@/services/analytics/events/overview'
import Track from '@/components/common/Track'
import { cn } from '@/utils/cn'
import css from './styles.module.css'

export type NotificationVariant = 'success' | 'info' | 'warning' | 'error'

const alertVariant: Record<NotificationVariant, 'success' | 'info' | 'warning' | 'destructive'> = {
  success: 'success',
  info: 'info',
  warning: 'warning',
  error: 'destructive',
}

export type NotificationLinkViewProps = {
  title: string
  /** Set for a navigating link; an action link has none */
  href?: LinkProps['href']
  isExternal: boolean
  onClick: (event: SyntheticEvent) => void
}

export const NotificationLinkView = ({ title, href, isExternal, onClick }: NotificationLinkViewProps): ReactElement => {
  const LinkWrapper = ({ children }: React.PropsWithChildren) =>
    href !== undefined ? (
      <NextLink href={href} passHref legacyBehavior>
        {children}
      </NextLink>
    ) : (
      <div className="flex">{children}</div>
    )

  return (
    <Track {...OVERVIEW_EVENTS.NOTIFICATION_INTERACTION} label={title} as="span">
      <LinkWrapper>
        <Link
          className={css.link}
          variant="inherit"
          onClick={onClick}
          {...(isExternal && { target: '_blank', rel: 'noopener noreferrer' })}
        >
          {title}
          <ChevronRight />
        </Link>
      </LinkWrapper>
    </Track>
  )
}

export type ToastAutoHideProps = {
  onMouseEnter: MouseEventHandler<HTMLDivElement>
  onMouseLeave: MouseEventHandler<HTMLDivElement>
  onFocus: FocusEventHandler<HTMLDivElement>
  onBlur: FocusEventHandler<HTMLDivElement>
}

export type ToastViewProps = {
  variant: NotificationVariant
  title?: string
  message: string
  detailedMessage?: string
  icon?: ReactNode
  hasLink: boolean
  link: ReactNode
  autoHideProps: ToastAutoHideProps
  onClose: () => void
}

export const ToastView = ({
  variant,
  title,
  message,
  detailedMessage,
  icon,
  hasLink,
  link,
  autoHideProps,
  onClose,
}: ToastViewProps): ReactElement => {
  return (
    <Alert
      variant={alertVariant[variant]}
      outlined={false}
      className={cn('w-[340px] shadow-lg', variant === 'error' && css.errorToast)}
      {...autoHideProps}
    >
      {icon ? icon : <AlertSeverityIcon variant={alertVariant[variant]} />}
      <AlertAction>
        <Button variant="ghost" size="icon-xs" aria-label="Close" onClick={onClose}>
          <X />
        </Button>
      </AlertAction>
      <AlertTitle>{title || message}</AlertTitle>

      {(title || detailedMessage || hasLink) && (
        <AlertDescription>
          {title && message}

          {detailedMessage && (
            <details>
              <Link render={<summary />}>Details</Link>
              <pre>{detailedMessage}</pre>
            </details>
          )}
          {link}
        </AlertDescription>
      )}
    </Alert>
  )
}

export type NotificationsViewProps = {
  toasts: { id: string; toast: ReactNode }[]
}

export const NotificationsView = ({ toasts }: NotificationsViewProps): ReactElement => {
  return (
    <div className={css.container}>
      {toasts.map(({ id, toast }) => (
        <div className={css.row} key={id}>
          {toast}
        </div>
      ))}
    </div>
  )
}
