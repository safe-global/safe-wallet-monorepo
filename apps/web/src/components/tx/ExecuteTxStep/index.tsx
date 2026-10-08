import { useContext, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import { AppRoutes } from '@/config/routes'
import { TxModalContext } from '@/components/tx-flow'
import { TxFlowStep } from '@/components/tx-flow/TxFlowStep'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import { TxFlowContext } from '@/components/tx-flow/TxFlowProvider'
import { useSafeScope } from '@/components/tx-flow/safe-scope/context'
import type { TxSenderScope } from '@/components/tx-flow/safe-scope/types'
import { Execute } from '@/components/tx-flow/actions/Execute'
import { Receipt } from '../ConfirmTxDetails/Receipt'
import useTxPreview from '../confirmation-views/useTxPreview'
import useChainId from '@/hooks/useChainId'
import { useSafeLinkQuery } from '@/hooks/useSafeLinkQuery'
import { createExistingTx } from '@/services/tx/tx-sender'
import {
  EXECUTE_OPTIONS,
  EXECUTE_TX_STEP_TITLE,
  ExecuteTxStepView,
} from '@views/components/tx/ExecuteTxStep/ExecuteTxStepView'

const EXECUTE_SLOT_ID = 'execute'

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
  const safeLinkQuery = useSafeLinkQuery()
  const [txPreview] = useTxPreview(safeTx?.data)
  const [isReloaded, setIsReloaded] = useState(false)

  const scopeSafeAddress = scope?.safeAddress
  const scopeSdk = scope?.sdk
  const txSenderScope = useMemo<TxSenderScope | undefined>(
    () => (scopeSafeAddress ? { chainId, safeAddress: scopeSafeAddress, sdk: scopeSdk } : undefined),
    [chainId, scopeSafeAddress, scopeSdk],
  )
  const scopedSafeQuery = scope?.chain ? `${scope.chain.shortName}:${scope.safeAddress}` : undefined

  useEffect(() => {
    if (!txId) return
    if (txSenderScope && !txSenderScope.sdk) return
    createExistingTx(chainId, txId, undefined, txSenderScope)
      .then((signedTx) => {
        setSafeTx(signedTx)
        setIsReloaded(true)
      })
      .catch(setSafeTxError)
  }, [txId, chainId, txSenderScope, setSafeTx, setSafeTxError])

  const executeLater = () => {
    setTxFlow(undefined)
    const query = scopedSafeQuery ? { ...safeLinkQuery, safe: scopedSafeQuery } : safeLinkQuery
    router.push({ pathname: AppRoutes.transactions.queue, query })
  }

  return (
    <TxFlowStep title={EXECUTE_TX_STEP_TITLE} fixedNonce hideBack>
      <ExecuteTxStepView
        isLoading={!safeTx || !isReloaded}
        afterSigning={afterSigning}
        onExecuteLater={executeLater}
        onBack={onPrev}
        receipt={
          safeTx && <Receipt safeTxData={safeTx.data} txData={txPreview?.txData} txInfo={txPreview?.txInfo} outlined />
        }
        renderExecute={(secondaryAction) => (
          <Execute
            options={EXECUTE_OPTIONS}
            onChange={() => {}}
            slotId={EXECUTE_SLOT_ID}
            secondaryAction={secondaryAction}
          />
        )}
      />
    </TxFlowStep>
  )
}
