import type { ReactNode } from 'react'
import { Check, Lock } from 'lucide-react'
import { Badge } from '@safe-global/views/components/ui/badge'
import { Button } from '@safe-global/views/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@safe-global/views/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@safe-global/views/components/ui/table'
import { DEFI_V1_COPY, formatApy, formatCompactUsd, formatLiveFor } from '../copy'
import type { Opportunity } from '../types'
import { OpportunityMark } from './TreasuryTables'

const COPY = DEFI_V1_COPY.compare

type CompareValue = ReactNode | boolean
type CompareSection = { title: string; rows: { feature: string; value: (item: Opportunity) => CompareValue }[] }

// Mirrors the cells of the plans page feature comparison.
const CompareCell = ({ value }: { value: CompareValue }) => {
  if (value === true) {
    return (
      <>
        <span aria-hidden className="flex size-5 items-center justify-center rounded-full bg-muted">
          <Check className="size-3" strokeWidth={2} />
        </span>
        <span className="sr-only">Yes</span>
      </>
    )
  }
  if (value === false) {
    return (
      <>
        <span aria-hidden className="text-muted-foreground">
          —
        </span>
        <span className="sr-only">No</span>
      </>
    )
  }
  return <>{value}</>
}

const SECTIONS: CompareSection[] = [
  {
    title: COPY.returns,
    rows: [
      {
        feature: COPY.rate,
        value: (item) => <span className="font-semibold tabular-nums">{formatApy(item.apy)}</span>,
      },
      { feature: COPY.fee, value: (item) => <span className="tabular-nums">{formatApy(item.managementFee)}</span> },
      { feature: COPY.paidListing, value: (item) => item.placement !== 'base' },
    ],
  },
  {
    title: COPY.exit,
    rows: [{ feature: COPY.exit, value: (item) => item.exitLabel }],
  },
  {
    title: COPY.access,
    rows: [
      { feature: DEFI_V1_COPY.toolbar.openOnly, value: (item) => item.access === 'all' && !item.kyc },
      { feature: COPY.kyc, value: (item) => item.kyc },
      { feature: COPY.networks, value: (item) => item.chains.join(', ') },
    ],
  },
  {
    title: COPY.trust,
    rows: [
      { feature: COPY.tvl, value: (item) => <span className="tabular-nums">{formatCompactUsd(item.tvl)}</span> },
      { feature: COPY.liveFor, value: (item) => formatLiveFor(item.liveSince) },
      { feature: COPY.audits, value: (item) => item.audits.join(', ') },
    ],
  },
]

export const CompareDialog = ({
  items,
  open,
  investedIds,
  isLocked,
  onClose,
  onDeposit,
  onSelect,
}: {
  items: Opportunity[]
  open: boolean
  investedIds: string[]
  isLocked: (item: Opportunity) => boolean
  onClose: () => void
  onDeposit: (item: Opportunity) => void
  onSelect: (item: Opportunity) => void
}) => (
  <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
    <DialogContent size="md" data-testid="compare-dialog">
      <DialogHeader divided="subtle">
        <DialogTitle>{COPY.title}</DialogTitle>
      </DialogHeader>
      <div className="px-4 pb-4">
        <Table className="table-fixed">
          <TableHeader>
            <TableRow className="bg-muted-secondary hover:bg-muted-secondary">
              <TableHead scope="col" className="h-11 w-[28%] px-4 py-0 align-middle font-semibold">
                {COPY.feature}
              </TableHead>
              {items.map((item) => (
                <TableHead key={item.id} scope="col" className="h-11 px-4 py-0 align-middle font-semibold">
                  <span className="flex min-w-0 items-center gap-2">
                    <OpportunityMark invested={investedIds.includes(item.id)} />
                    <span className="truncate">{item.name}</span>
                    {investedIds.includes(item.id) && (
                      <Badge variant="mint" size="status" shape="status">
                        {DEFI_V1_COPY.invested}
                      </Badge>
                    )}
                  </span>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          {SECTIONS.map((section) => (
            <TableBody key={section.title} className="[&_tr:last-child]:border-b">
              <TableRow className="bg-muted hover:bg-muted">
                <TableHead
                  scope="colgroup"
                  colSpan={items.length + 1}
                  className="h-auto px-4 py-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase"
                >
                  {section.title}
                </TableHead>
              </TableRow>
              {section.rows.map((row) => (
                <TableRow key={row.feature} className="hover:bg-transparent">
                  <TableHead scope="row" className="h-auto px-4 py-3 font-normal whitespace-normal">
                    {row.feature}
                  </TableHead>
                  {items.map((item) => (
                    <TableCell key={item.id} className="px-4 py-3 whitespace-normal">
                      <CompareCell value={row.value(item)} />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          ))}
          <TableBody>
            <TableRow className="hover:bg-transparent">
              <TableCell />
              {items.map((item) => {
                const locked = isLocked(item)
                return (
                  <TableCell key={item.id} className="px-4 py-3">
                    <Button
                      variant={locked ? 'outline' : 'default'}
                      size="sm"
                      onClick={() => (locked ? onSelect(item) : onDeposit(item))}
                    >
                      {locked && <Lock />}
                      {locked ? DEFI_V1_COPY.proOnly : DEFI_V1_COPY.factSheet.deposit}
                    </Button>
                  </TableCell>
                )
              })}
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </DialogContent>
  </Dialog>
)
