import type { TransactionData } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import useChainId from '@/hooks/useChainId'
import { Skeleton } from '@safe-global/views/components/ui/skeleton'
import ErrorMessage from '@/components/tx/ErrorMessage'
import { useTransactionsGetTransactionByIdV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { useContext, useMemo } from 'react'
import { TxFlowContext, type TxFlowContextType } from '@/components/tx-flow/TxFlowProvider'
import { deriveEnvelopeSafeTxHash, type NestedTxEnvelope } from '@/services/tx/nestedTxEnvelope'
import useTxPreview from '@/components/tx/confirmation-views/useTxPreview'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { OperationType } from '@safe-global/types-kit'
import { NestedTransaction } from '../NestedTransaction'
import TxData from '../..'
import DecodedData from '../../DecodedData'
import { useSignedHash } from '../useSignedHash'

export const OnChainConfirmation = ({
  data,
  isConfirmationView = false,
}: {
  data?: TransactionData | null
  isConfirmationView?: boolean
}) => {
  const chainId = useChainId()
  const signedHash = useSignedHash(data)

  // Display fallback when the child tx is unknown to the service
  const { data: flowData } = useContext(TxFlowContext) as TxFlowContextType<{ nestedChildTx?: NestedTxEnvelope }>
  const envelopeChildTx = flowData?.nestedChildTx

  const verifiedEnvelopeTx = useMemo<NestedTxEnvelope | undefined>(() => {
    // A batch can hold several approveHash calls but the flow carries only one envelope
    if (!envelopeChildTx || !signedHash) return undefined
    if (deriveEnvelopeSafeTxHash(envelopeChildTx).toLowerCase() !== signedHash.toLowerCase()) {
      console.info('[NestedTxEnvelope] flow envelope does not match the displayed approveHash, ignoring it', {
        signedHash,
        envelopeChildTx,
      })
      return undefined
    }
    if (data?.to?.value && !sameAddress(data.to.value, envelopeChildTx.safe)) {
      console.info('[NestedTxEnvelope] envelope Safe differs from the approveHash target, ignoring it', {
        approveHashTarget: data.to.value,
        envelopeSafe: envelopeChildTx.safe,
      })
      return undefined
    }
    if (chainId && envelopeChildTx.chainId !== chainId) {
      console.info('[NestedTxEnvelope] envelope chainId differs from the current chain, ignoring it', {
        chainId,
        envelopeChainId: envelopeChildTx.chainId,
      })
      return undefined
    }

    console.info('[NestedTxEnvelope] rendering approveHash details from the verified envelope', { signedHash })
    return envelopeChildTx
  }, [envelopeChildTx, signedHash, data?.to?.value, chainId])

  const [envelopePreview] = useTxPreview(
    verifiedEnvelopeTx && {
      to: verifiedEnvelopeTx.to,
      value: verifiedEnvelopeTx.value,
      data: verifiedEnvelopeTx.data,
      operation: verifiedEnvelopeTx.operation === 1 ? OperationType.DelegateCall : OperationType.Call,
    },
    verifiedEnvelopeTx?.safe,
  )

  const rawEnvelopeTxData = useMemo<TransactionData | undefined>(
    () =>
      verifiedEnvelopeTx && {
        hexData: verifiedEnvelopeTx.data,
        to: { value: verifiedEnvelopeTx.to },
        value: verifiedEnvelopeTx.value,
        operation: verifiedEnvelopeTx.operation === 1 ? 1 : 0,
      },
    [verifiedEnvelopeTx],
  )

  // The first signer's child tx isn't known to the service yet
  const { data: nestedTxDetails, error: txDetailsError } = useTransactionsGetTransactionByIdV1Query(
    { chainId: chainId || '', id: signedHash || '' },
    { skip: !signedHash || !chainId || !!verifiedEnvelopeTx },
  )

  return (
    <NestedTransaction txData={data} isConfirmationView={isConfirmationView}>
      {verifiedEnvelopeTx && envelopePreview ? (
        <TxData
          txData={envelopePreview.txData}
          txInfo={envelopePreview.txInfo}
          trusted
          imitation={false}
          executingSafeAddress={verifiedEnvelopeTx.safe}
        />
      ) : rawEnvelopeTxData ? (
        <DecodedData txData={rawEnvelopeTxData} toInfo={rawEnvelopeTxData.to} />
      ) : nestedTxDetails ? (
        <TxData
          txData={nestedTxDetails.txData}
          txInfo={nestedTxDetails.txInfo}
          txDetails={nestedTxDetails}
          trusted
          imitation={false}
        />
      ) : txDetailsError ? (
        <ErrorMessage>Could not load details on hash to approve.</ErrorMessage>
      ) : (
        <Skeleton className="h-5 w-full" />
      )}
    </NestedTransaction>
  )
}
