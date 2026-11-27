import { useState, type ReactElement } from 'react'

import { Badge } from '@safe-global/views/components/ui/badge'
import { Button } from '@safe-global/views/components/ui/button'
import { ButtonGroup } from '@safe-global/views/components/ui/button-group'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@safe-global/views/components/ui/table'
import { Typography } from '@safe-global/views/components/ui/typography'

import type { ReportBreakdownLine } from '../types'

type BreakdownView = 'safeAccount' | 'asset'

export const ReportBreakdown = ({
  bySafeAccount,
  byAsset,
}: {
  bySafeAccount: ReportBreakdownLine[]
  byAsset: ReportBreakdownLine[]
}): ReactElement => {
  const [view, setView] = useState<BreakdownView>('safeAccount')
  const isByAsset = view === 'asset'
  const lines = isByAsset ? byAsset : bySafeAccount

  return (
    <div className="flex flex-col gap-3 py-2 pr-2 pl-7">
      <ButtonGroup>
        <Button
          variant={isByAsset ? 'outline' : 'default'}
          aria-pressed={!isByAsset}
          onClick={() => setView('safeAccount')}
        >
          By Safe account
        </Button>
        <Button variant={isByAsset ? 'default' : 'outline'} aria-pressed={isByAsset} onClick={() => setView('asset')}>
          By asset
        </Button>
      </ButtonGroup>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-muted-foreground">{isByAsset ? 'Asset' : 'Safe account'}</TableHead>
            {isByAsset && <TableHead className="text-right text-muted-foreground">Quantity</TableHead>}
            <TableHead className="text-right text-muted-foreground">Change</TableHead>
            <TableHead className="text-right text-muted-foreground">{isByAsset ? 'Value' : 'Balance'}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {lines.map((line) => (
            <TableRow key={line.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Typography variant="paragraph-small-medium">{line.name}</Typography>
                  {line.detail &&
                    (isByAsset ? (
                      <Badge variant="secondary">{line.detail}</Badge>
                    ) : (
                      <Typography variant="paragraph-mini" color="muted">
                        {line.detail}
                      </Typography>
                    ))}
                </div>
              </TableCell>
              {isByAsset && <TableCell className="text-right tabular-nums">{line.quantity}</TableCell>}
              <TableCell className="text-right tabular-nums">
                {line.change}
                {line.changePercent && <span className="ml-1.5 text-muted-foreground">{line.changePercent}</span>}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {line.isUnavailable ? <Badge variant="warning">Unavailable</Badge> : line.value}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
