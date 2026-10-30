import type { ReactElement } from 'react'
import { Badge } from '@safe-global/views/components/ui/badge'
import { TableCell, TableRow } from '@safe-global/views/components/ui/table'
import ExternalLink from '@safe-global/views/components/common/ExternalLink'
import { HelpCenterArticle } from '@safe-global/utils/config/constants'
import { QUEUE_COLUMNS } from '../../SpaceQueueRow'

const ConflictHeaderRow = ({ nonce, size }: { nonce?: number; size: number }): ReactElement => (
  <TableRow data-no-hover data-no-divider>
    <TableCell className="pt-4 pb-1 text-center text-sm tabular-nums text-muted-foreground">{nonce}</TableCell>
    <TableCell colSpan={QUEUE_COLUMNS.length - 1} className="pt-4 pb-1">
      <span className="flex items-center gap-2 text-xs">
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
