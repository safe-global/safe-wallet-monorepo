import { Layers } from 'lucide-react'
import { Button } from '@safe-global/views/components/ui/button'
import { Badge } from '@safe-global/views/components/ui/badge'
import { Card, CardContent } from '@safe-global/views/components/ui/card'
import { Alert, AlertDescription, AlertSeverityIcon } from '@safe-global/views/components/ui/alert'
import { ICON_STROKE } from '@safe-global/views/components/common/iconStroke'
import { Drawer, DrawerHeader, DrawerTitle, DrawerBody, DrawerFooter } from '@/components/common/Drawer'
import Identicon from '@/components/common/Identicon'
import { getTransactionLabel } from '../services/model'
import type { BulkBatch } from '../services/queue'

const plural = (count: number) => (count === 1 ? 'transaction' : 'transactions')

export function BulkExecuteDrawer({
  open,
  batches,
  isMobile,
  onClose,
  onExecute,
}: {
  open: boolean
  batches: BulkBatch[]
  isMobile: boolean
  onClose: () => void
  onExecute: () => void
}) {
  const executableCount = batches.reduce((total, batch) => total + batch.proposals.length, 0)
  return (
    <Drawer mobileFullScreen open={open} onClose={onClose} ariaLabel="Bulk execute">
      <DrawerHeader className="pr-20">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Layers className="size-4" strokeWidth={ICON_STROKE} />
        </span>
        <DrawerTitle>Bulk execute</DrawerTitle>
      </DrawerHeader>
      <DrawerBody>
        <p className="text-sm text-muted-foreground" data-prototype-element="Bulk execute">
          Only fully signed transactions with consecutive nonces are included. Each Safe executes its batch as a
          separate transaction from your wallet.
        </p>
        <div className="mt-4 space-y-3" data-prototype-element="Bulk execute">
          {batches.map((batch) => (
            <Card
              as="section"
              key={batch.account.id}
              aria-label={`${batch.account.name} batch`}
              variant="outlined"
              size="sm"
            >
              <CardContent>
                <div className="flex flex-wrap items-center gap-3">
                  <Identicon address={batch.account.iconAddress} size={32} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{batch.account.name}</p>
                    <p className="whitespace-nowrap text-xs text-muted-foreground">
                      {batch.account.network} · {batch.account.address}
                    </p>
                  </div>
                  {batch.proposals.length > 0 && (
                    <Badge variant="outline">
                      {batch.proposals.length} {plural(batch.proposals.length)} · #{batch.proposals[0].nonce}
                      {batch.proposals.length > 1 && `–#${batch.proposals[batch.proposals.length - 1].nonce}`}
                    </Badge>
                  )}
                </div>
                {batch.proposals.length > 0 && (
                  <ol className="mt-3 space-y-1.5">
                    {batch.proposals.map((tx) => (
                      <li key={tx.id} className="flex items-center justify-between gap-3 text-sm">
                        <span className="truncate">{getTransactionLabel(tx)}</span>
                        <span className="shrink-0 text-xs tabular-nums text-muted-foreground">#{tx.nonce}</span>
                      </li>
                    ))}
                  </ol>
                )}
                {batch.blocked && (
                  <Alert variant="warning" outlined={false} className="mt-3">
                    <AlertSeverityIcon variant="warning" />
                    <AlertDescription>
                      {batch.proposals.length
                        ? `Stops before #${batch.blocked.nonce}: choose one of its ${batch.blocked.competing} competing proposals first.`
                        : `Not included. Choose one of the ${batch.blocked.competing} competing proposals at #${batch.blocked.nonce} first.`}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </DrawerBody>
      <DrawerFooter safeArea>
        <Button size={isMobile ? 'xl' : 'default'} className="w-full" disabled={!executableCount} onClick={onExecute}>
          Execute {executableCount} {plural(executableCount)} in preview
        </Button>
      </DrawerFooter>
    </Drawer>
  )
}
