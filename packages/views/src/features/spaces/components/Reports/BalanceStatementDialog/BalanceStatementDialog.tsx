import { Fragment, type ReactElement } from 'react'
import { Download } from 'lucide-react'

import { Badge } from '@safe-global/views/components/ui/badge'
import { Button } from '@safe-global/views/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@safe-global/views/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@safe-global/views/components/ui/table'
import { Typography } from '@safe-global/views/components/ui/typography'

import type { BalanceStatement } from '../types'

export const BalanceStatementDialog = ({
  statement,
  onClose,
  onDownload,
}: {
  statement?: BalanceStatement
  onClose: () => void
  onDownload: () => void
}): ReactElement => (
  <Dialog open={statement !== undefined} onOpenChange={(open) => !open && onClose()}>
    {statement && (
      <DialogContent size="md" padding="none" showCloseButton={false} className="flex max-h-[90vh] flex-col">
        <DialogHeader divided>
          <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4 px-2 pt-2">
            <div className="flex flex-col gap-1">
              <Typography variant="paragraph-small" color="muted">
                {statement.workspaceName}
              </Typography>
              <DialogTitle className="text-2xl font-semibold">Balance statement</DialogTitle>
              <DialogDescription>{statement.asOf}</DialogDescription>
            </div>
            <div className="flex flex-col gap-1.5 sm:items-end">
              <Typography variant="paragraph-small" color="muted">
                Total balance
              </Typography>
              <Typography variant="h2" as="p">
                {statement.total}
              </Typography>
            </div>
          </div>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-muted-foreground">Asset</TableHead>
                <TableHead className="text-muted-foreground max-md:hidden">Network</TableHead>
                <TableHead className="text-right text-muted-foreground">Quantity</TableHead>
                <TableHead className="text-right text-muted-foreground max-md:hidden">Price</TableHead>
                <TableHead className="text-right text-muted-foreground">Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {statement.groups.map((group) => (
                <Fragment key={group.id}>
                  <TableRow className="border-0 bg-muted/60 hover:bg-muted/60">
                    <TableCell className="rounded-l-md">
                      <div className="flex items-center gap-2">
                        <Typography variant="paragraph-small-bold">{group.name}</Typography>
                        <Typography variant="paragraph-mini" color="muted" className="max-md:hidden">
                          {group.address}
                        </Typography>
                      </div>
                    </TableCell>
                    <TableCell className="max-md:hidden" />
                    <TableCell />
                    <TableCell className="max-md:hidden" />
                    <TableCell className="rounded-r-md text-right font-semibold tabular-nums">
                      {group.isUnavailable ? <Badge variant="warning">Unavailable</Badge> : group.subtotal}
                    </TableCell>
                  </TableRow>
                  {group.lines.map((line) => (
                    <TableRow key={line.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Typography variant="paragraph-small-medium">{line.asset}</Typography>
                          {line.protocol && <Badge variant="secondary">{line.protocol}</Badge>}
                        </div>
                      </TableCell>
                      <TableCell className="max-md:hidden">{line.network}</TableCell>
                      <TableCell className="text-right tabular-nums">{line.quantity}</TableCell>
                      <TableCell className="text-right tabular-nums max-md:hidden">{line.price}</TableCell>
                      <TableCell className="text-right tabular-nums">{line.value}</TableCell>
                    </TableRow>
                  ))}
                </Fragment>
              ))}
            </TableBody>
          </Table>
        </div>

        <DialogFooter divided>
          <div className="flex flex-wrap items-center justify-between gap-3 px-2">
            <Typography variant="paragraph-small" color="muted" className="break-all">
              {statement.fileName}
            </Typography>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              <Button onClick={onDownload}>
                <Download />
                Download CSV
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    )}
  </Dialog>
)
