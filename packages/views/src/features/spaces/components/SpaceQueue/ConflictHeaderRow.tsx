import type { ComponentProps, ReactElement } from 'react'
import { Badge } from '@safe-global/views/components/ui/badge'
import { TableCell, TableRow } from '@safe-global/views/components/ui/table'
import ExternalLink from '@safe-global/views/components/common/ExternalLink'
import { HelpCenterArticle } from '@safe-global/utils/config/constants'
import { QUEUE_COLUMNS, QUEUE_ROW_LABEL } from './columns'
import { ConflictBracketStart } from './ConflictBracket'

const ConflictHeaderRow = ({
  nonce,
  size,
  rowProps,
}: {
  nonce?: number
  size: number
  rowProps?: ComponentProps<'tr'>
}): ReactElement => (
  <TableRow data-no-hover data-no-divider {...rowProps}>
    {/* Top-aligned beside the badge when the label wraps; ConflictBracketStart's top-10 depends on pt-4 text-sm */}
    <TableCell
      data-pin="start"
      className="relative pt-4 pb-1 align-top text-center text-sm tabular-nums text-muted-foreground"
    >
      {nonce}
      <ConflictBracketStart />
    </TableCell>
    <TableCell colSpan={QUEUE_COLUMNS.length - 1} className="pt-4 pb-1 whitespace-normal">
      {/* Wraps rather than widening a narrow panel */}
      <span className={`flex flex-wrap items-center gap-x-2 gap-y-1 text-xs ${QUEUE_ROW_LABEL}`}>
        <Badge variant="warning">Conflicting</Badge>
        <span className="text-muted-foreground">
          Only 1/{size} transactions can execute. Once it does, the {size === 2 ? 'other becomes' : 'others become'}{' '}
          invalid.
        </span>
        <ExternalLink href={HelpCenterArticle.CONFLICTING_TRANSACTIONS} className="text-muted-foreground" noIcon>
          Learn more
        </ExternalLink>
      </span>
    </TableCell>
  </TableRow>
)

export default ConflictHeaderRow
