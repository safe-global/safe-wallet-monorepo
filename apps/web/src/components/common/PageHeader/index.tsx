import { Typography } from '@/components/ui/typography'
import classNames from 'classnames'

import type { ReactElement } from 'react'

import { useCssHeightVar } from '@/hooks/useCssHeightVar'
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
  // `Sticky` sub-headers pin at this header's bottom edge, which moves when its actions wrap.
  const setHeaderNode = useCssHeightVar('--page-header-height')

  return (
    <div ref={setHeaderNode} className={classNames(css.container, { [css.border]: noBorder })}>
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
