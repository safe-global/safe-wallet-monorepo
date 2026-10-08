import type { ReactElement, CSSProperties } from 'react'
import { useMemo } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

import css from './styles.module.css'

export type IdenticonViewProps = {
  /** Data URL of the blockie image, or null when the address is not valid */
  blockie: string | null
  size: number
}

export function IdenticonView({ blockie, size }: IdenticonViewProps): ReactElement {
  const style = useMemo<CSSProperties | null>(
    () =>
      blockie
        ? {
            backgroundImage: `url(${blockie})`,
            width: `${size}px`,
            height: `${size}px`,
          }
        : null,
    [blockie, size],
  )

  return !style ? (
    <Skeleton className="rounded-full" style={{ width: size, height: size }} />
  ) : (
    <div className={css.icon} style={style} />
  )
}
