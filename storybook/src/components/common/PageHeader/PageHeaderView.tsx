import { Typography } from '@/components/ui/typography'
import classNames from 'classnames'

import type { ReactElement, Ref } from 'react'

import css from './styles.module.css'

export type PageHeaderViewProps = {
  title?: string
  action?: ReactElement
  noBorder?: boolean
  headerRef: Ref<HTMLDivElement>
}

export function PageHeaderView({ title, action, noBorder, headerRef }: PageHeaderViewProps): ReactElement {
  return (
    <div ref={headerRef} className={classNames(css.container, { [css.border]: noBorder })}>
      {title && (
        <Typography variant="h3" className={css.title}>
          {title}
        </Typography>
      )}
      {action}
    </div>
  )
}
