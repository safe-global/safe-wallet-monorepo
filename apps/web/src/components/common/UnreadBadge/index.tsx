import React from 'react'
import classNames from 'classnames'
import { Badge } from '@/components/ui/badge'

type AnchorOrigin = {
  vertical: 'top' | 'bottom'
  horizontal: 'left' | 'right'
}

type UnreadBadgeProps = {
  children?: React.ReactNode
  invisible?: boolean
  anchorOrigin?: AnchorOrigin
  count?: number
}

const UnreadBadge = ({
  children,
  count,
  invisible,
  anchorOrigin = { vertical: 'top', horizontal: 'right' },
}: UnreadBadgeProps) => {
  const isDot = count === undefined

  return (
    <span className="relative inline-flex shrink-0 align-middle">
      {children}
      {!invisible && (
        <Badge
          variant="secondary"
          className={classNames('pointer-events-none absolute z-10 px-1', {
            'top-0 -translate-y-1/2': anchorOrigin.vertical === 'top',
            'bottom-0 translate-y-1/2': anchorOrigin.vertical === 'bottom',
            'right-0 translate-x-1/2': anchorOrigin.horizontal === 'right',
            'left-0 -translate-x-1/2': anchorOrigin.horizontal === 'left',
            'size-2 min-w-0 rounded-full bg-[var(--color-success-main)] p-0': isDot,
            'h-5 min-w-5': !isDot,
          })}
        >
          {!isDot && count}
        </Badge>
      )}
    </span>
  )
}

export default UnreadBadge
