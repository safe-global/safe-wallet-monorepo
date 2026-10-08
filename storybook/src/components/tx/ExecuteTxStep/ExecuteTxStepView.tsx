import type { ReactNode } from 'react'
import TxCard from '@/components/tx-flow/common/TxCard'
import { Spinner } from '@/components/ui/spinner'
import { Alert, AlertDescription, AlertSeverityIcon } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Typography } from '@/components/ui/typography'

export const EXECUTE_TX_STEP_TITLE = 'Execute transaction'

export const EXECUTE_OPTIONS = [{ id: 'execute', label: 'Execute' }]

export type ExecuteTxStepViewProps = {
  isLoading: boolean
  afterSigning: boolean
  onExecuteLater: () => void
  onBack: () => void
  receipt: ReactNode
  renderExecute: (secondaryAction: ReactNode) => ReactNode
}

export const ExecuteTxStepView = ({
  isLoading,
  afterSigning,
  onExecuteLater,
  onBack,
  receipt,
  renderExecute,
}: ExecuteTxStepViewProps) => {
  return (
    <TxCard contentPadding="compactBottom">
      {isLoading ? (
        <div className="flex items-center justify-center py-10">
          <Spinner className="size-6" />
        </div>
      ) : (
        <>
          <Alert
            variant="subtle"
            role="note"
            data-testid="signed-notice"
            className="border-[var(--color-border-light)] *:data-[slot=alert-description]:text-foreground *:[svg]:text-muted-foreground"
          >
            <AlertSeverityIcon variant="info" aria-hidden="true" />
            <AlertDescription>
              This transaction is fully signed. Nothing has been sent to the network yet.
            </AlertDescription>
          </Alert>

          {receipt}

          {renderExecute(
            afterSigning ? (
              <Button data-testid="execute-later-btn" variant="outline" size="lg" onClick={onExecuteLater}>
                Execute later
              </Button>
            ) : (
              <Button data-testid="modal-back-btn" variant="outline" size="lg" onClick={onBack}>
                Back
              </Button>
            ),
          )}

          <Separator bleed="6" />

          <Typography
            variant="paragraph-small"
            color="muted"
            role="note"
            data-testid="execute-notice"
            className="flex gap-3"
          >
            <AlertSeverityIcon variant="info" aria-hidden="true" className="size-4 shrink-0 translate-y-0.5" />
            Executing submits this transaction on-chain and costs gas. Anyone can execute it &mdash; it doesn&apos;t
            have to be you.
          </Typography>
        </>
      )}
    </TxCard>
  )
}
