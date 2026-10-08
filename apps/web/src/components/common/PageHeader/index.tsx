import type { ReactElement } from 'react'

import { useCssHeightVar } from '@/hooks/useCssHeightVar'
import { PageHeaderView } from '@views/components/common/PageHeader/PageHeaderView'

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

  return <PageHeaderView title={title} action={action} noBorder={noBorder} headerRef={setHeaderNode} />
}

export default PageHeader
