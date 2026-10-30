import { useState, type ReactElement } from 'react'
import { Card, CardContent } from '@safe-global/views/components/ui/card'
import { Table, TableHead, TableHeader, TableRow } from '@safe-global/views/components/ui/table'
import useWallet from '@/hooks/wallets/useWallet'
import type { SpaceQueueSection } from '../../../store/spaceQueueApi'
import { QUEUE_COLUMNS } from '../SpaceQueueRow'
import { getSafeKey } from '../utils'
import CollapseAllButton from './CollapseAllButton'
import SafeSection from './SafeSection'

// Widths include the 16px cell padding on each side; a wider table spreads its extra width across all of them.
const COLUMN_WIDTHS: Record<(typeof QUEUE_COLUMNS)[number], string> = {
  Nonce: 'w-16',
  Transaction: 'w-[21.5rem]',
  To: '',
  Proposed: 'w-36',
  Signatures: 'w-28',
  Status: 'w-40',
  Action: 'w-36',
}

const SpaceQueueTable = ({ sections }: { sections: SpaceQueueSection[] }): ReactElement => {
  const wallet = useWallet()
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set())
  const allCollapsed = sections.every((section) => collapsedIds.has(getSafeKey(section.safeAddress)))

  const toggleSection = (id: string) =>
    setCollapsedIds((prev) => {
      const next = new Set(prev)
      if (!next.delete(id)) next.add(id)
      return next
    })

  const toggleAll = () =>
    setCollapsedIds(allCollapsed ? new Set() : new Set(sections.map((section) => getSafeKey(section.safeAddress))))

  return (
    <Card radius="xl" size="none">
      <CardContent>
        <Table
          aria-label="Pending transactions"
          variant="panel"
          className="table-fixed min-w-[1240px] [&_td]:px-4 [&_th]:px-4"
        >
          <colgroup>
            {QUEUE_COLUMNS.map((label) => (
              <col key={label} className={COLUMN_WIDTHS[label]} />
            ))}
          </colgroup>
          <TableHeader>
            <TableRow data-no-hover className="group/head">
              {QUEUE_COLUMNS.map((label) => (
                <TableHead
                  key={label}
                  scope="col"
                  className={`text-xs text-muted-foreground ${label === 'Nonce' ? 'px-0! text-center' : ''}`}
                >
                  {label === 'To' ? (
                    <span className="sr-only">{label}</span>
                  ) : label === 'Action' ? (
                    <span className="flex items-center justify-end">
                      <span className="sr-only">{label}</span>
                      <CollapseAllButton allCollapsed={allCollapsed} count={sections.length} onToggle={toggleAll} />
                    </span>
                  ) : (
                    label
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          {sections.map((section) => {
            const id = getSafeKey(section.safeAddress)
            return (
              <SafeSection
                key={id}
                section={section}
                collapsed={collapsedIds.has(id)}
                onToggle={() => toggleSection(id)}
                walletAddress={wallet?.address}
              />
            )
          })}
        </Table>
      </CardContent>
    </Card>
  )
}

export default SpaceQueueTable
