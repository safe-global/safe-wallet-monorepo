import { useContext, type ReactElement } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@safe-global/views/components/ui/dialog'
import { Typography } from '@safe-global/views/components/ui/typography'
import { TxModalContext } from '@/components/tx-flow'
import { TokenTransferFlow } from '@/components/tx-flow/flows'
import { SafeList } from './SafeList'
import { useSafeRequest, type Shell } from './useShell'

/** With All Safes picked, anything that needs one Safe asks which Safe first. */
export const SafeRequestDialog = ({ shell }: { shell: Shell }): ReactElement | null => {
  const [request, setRequest] = useSafeRequest()
  const { setTxFlow } = useContext(TxModalContext)

  if (!request) return null

  const pick = (safe: string | null) => {
    setRequest(null)
    void shell.pickSafe(shell.workspace.context, safe, request.page).then(() => {
      if (request.thenSend) setTxFlow(<TokenTransferFlow />)
    })
  }

  return (
    <Dialog open onOpenChange={(open) => !open && setRequest(null)}>
      <DialogContent size="sm" surface="card" padding="sm" data-testid="unified-safe-request">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <Typography variant="h3" as={DialogTitle}>
              {request.label}: which Safe?
            </Typography>
            <Typography color="muted" as={DialogDescription}>
              This needs one Safe. Pick it and you&apos;ll go straight there.
            </Typography>
          </div>
          <SafeList workspace={shell.workspace} hasAllSafes={false} onPick={pick} autoFocus />
        </div>
      </DialogContent>
    </Dialog>
  )
}
