import { Typography } from '@/components/ui/typography'
import classNames from 'classnames'

import type { ReactElement } from 'react'

import css from './styles.module.css'

const PageHeader = ({
  title,
  action,
  noBorder,
}: {
  title?: string
  action?: ReactElement
  noBorder?: boolean
}): ReactElement => {
  return (
    <div className={classNames(css.container, { [css.border]: noBorder })}>
      {title && (
        <Typography variant="h3" className={css.title}>
          {title}
        </Typography>
      )}
      {action}
    </div>
  )
}

export default PageHeader
