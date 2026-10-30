import type { ReactElement } from 'react'
import { ChevronDown } from 'lucide-react'
import { Button } from '@safe-global/views/components/ui/button'
import { TableCell, TableRow } from '@safe-global/views/components/ui/table'
import { useChain } from '@/hooks/useChains'
import { QUEUE_COLUMNS } from '../../SpaceQueueRow'

const ChainHeaderRow = ({
  chainId,
  nextNonce,
  collapsed,
  onToggle,
  controls,
}: {
  chainId: string
  nextNonce?: number
  collapsed: boolean
  onToggle: () => void
  controls: string
}): ReactElement => {
  const chain = useChain(chainId)
  const chainName = chain?.chainName ?? chainId
  return (
    <TableRow data-no-hover className="cursor-pointer" onClick={onToggle}>
      <TableCell className="py-0!">
        <span className="flex justify-center">
          <Button
            size="icon-xs"
            variant="ghost-muted"
            aria-label={`${collapsed ? 'Expand' : 'Collapse'} ${chainName}`}
            aria-expanded={!collapsed}
            aria-controls={controls}
          >
            <ChevronDown className={`transition-transform ${collapsed ? '-rotate-90' : ''}`} />
          </Button>
        </span>
      </TableCell>
      <TableCell colSpan={QUEUE_COLUMNS.length - 1} className="py-0! pr-3!">
        <div className="flex h-6 items-center gap-2 text-xs">
          {chain?.chainLogoUri && <img src={chain.chainLogoUri} alt="" className="size-4 rounded-full" />}
          <span className="font-medium">{chainName}</span>
          {nextNonce !== undefined && <span className="font-mono text-muted-foreground">Next #{nextNonce}</span>}
        </div>
      </TableCell>
    </TableRow>
  )
}

export default ChainHeaderRow
