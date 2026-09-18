import { useContext, useEffect, useState } from 'react'
import TxCard from '@/components/tx-flow/common/TxCard'
import { Spinner } from '@/components/ui/spinner'
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
 * Shown after the signer of a 1/n Safe signed in the previous step. The signed transaction is
 * reloaded from the gateway so gas is estimated against the real signature before executing.
 */
export const ExecuteTxStep = () => {
  const chainId = useChainId()
  const scope = useSafeScope()
  const { safeTx, setSafeTx, setSafeTxError } = useContext(SafeTxContext)
  const { txId } = useContext(TxFlowContext)
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

  return (
    <TxFlowStep title="Execute transaction" fixedNonce hideBack>
      <TxCard>
        {!safeTx || !isReloaded ? (
          <div className="flex items-center justify-center py-10">
            <Spinner className="size-6" />
          </div>
        ) : (
          <>
            <Receipt safeTxData={safeTx.data} txData={txPreview?.txData} txInfo={txPreview?.txInfo} />

            <Execute options={EXECUTE_OPTIONS} onChange={() => {}} slotId="execute" />
          </>
        )}
      </TxCard>
    </TxFlowStep>
  )
}
