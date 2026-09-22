import { useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { AppRoutes } from '@/config/routes'
import TxCard from '@/components/tx-flow/common/TxCard'
import { Spinner } from '@/components/ui/spinner'
import { Alert, AlertDescription, AlertSeverityIcon } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Typography } from '@/components/ui/typography'
import { TxModalContext } from '@/components/tx-flow'
import { TxFlowStep } from '@/components/tx-flow/TxFlowStep'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import { TxFlowContext } from '@/components/tx-flow/TxFlowProvider'
import { useSafeScope } from '@/components/tx-flow/safe-scope/context'
import { Execute } from '@/components/tx-flow/actions/Execute'
import { Receipt } from '../ConfirmTxDetails/Receipt'
import useTxPreview from '../confirmation-views/useTxPreview'
import useChainId from '@/hooks/useChainId'
import { createExistingTx } from '@/services/tx/tx-sender'

const EXECUTE_OPTIONS = [{ id: 'execute', label: 'Execute' }]

/**
 * Execute step for a fully signed transaction: after the sign step of a 1/n Safe, or straight from
 * the queue. The transaction is reloaded from the gateway so gas is estimated against the real
 * signatures before executing.
 */
export const ExecuteTxStep = ({ afterSigning = false }: { afterSigning?: boolean }) => {
  const chainId = useChainId()
  const scope = useSafeScope()
  const { safeTx, setSafeTx, setSafeTxError } = useContext(SafeTxContext)
  const { txId, onPrev } = useContext(TxFlowContext)
  const { setTxFlow } = useContext(TxModalContext)
  const router = useRouter()
  const [txPreview] = useTxPreview(safeTx?.data)
  const [isReloaded, setIsReloaded] = useState(false)

  useEffect(() => {
    if (!txId) return
    createExistingTx(chainId, txId, undefined, scope)
      .then((signedTx) => {
        setSafeTx(signedTx)
        setIsReloaded(true)
      })
      .catch(setSafeTxError)
  }, [txId, chainId, scope, setSafeTx, setSafeTxError])

  const executeLater = () => {
    setTxFlow(undefined)
    router.push({ pathname: AppRoutes.transactions.queue, query: { safe: router.query.safe } })
  }

  return (
    <TxFlowStep title="Execute transaction" fixedNonce hideBack>
      <TxCard>
        {!safeTx || !isReloaded ? (
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

            <Receipt safeTxData={safeTx.data} txData={txPreview?.txData} txInfo={txPreview?.txInfo} tabsOutside />

            <Execute
              options={EXECUTE_OPTIONS}
              onChange={() => {}}
              slotId="execute"
              secondaryAction={
                afterSigning ? (
                  <Button data-testid="execute-later-btn" variant="outline" size="lg" onClick={executeLater}>
                    Execute later
                  </Button>
                ) : (
                  <Button data-testid="modal-back-btn" variant="outline" size="lg" onClick={onPrev}>
                    Back
                  </Button>
                )
              }
            />

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
    </TxFlowStep>
  )
}
