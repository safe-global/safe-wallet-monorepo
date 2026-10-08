import type { TransactionData } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { Safe__factory } from '@safe-global/utils/types/contracts'
import ErrorMessage from '@/components/tx/ErrorMessage'

import { useCurrentChain } from '@/hooks/useChains'
import { AppRoutes } from '@/config/routes'
import { useMemo } from 'react'
import type { SafeTransaction } from '@safe-global/types-kit'
import { NestedTransaction } from '../NestedTransaction'
import useTxPreview from '@/components/tx/confirmation-views/useTxPreview'
import TxData from '../..'
import { useUrlSpaceId, withSpaceId } from '@/hooks/useUrlSpaceId'
import { ExecTransactionView } from '@views/components/transactions/TxDetails/TxData/NestedTransaction/ExecTransaction/ExecTransactionView'

const safeInterface = Safe__factory.createInterface()

const extractTransactionData = (data: string): SafeTransaction | undefined => {
  const params = data ? safeInterface.decodeFunctionData('execTransaction', data) : undefined
  if (!params || params.length !== 10) {
    return
  }

  return {
    addSignature: () => {},
    encodedSignatures: () => params[9],
    getSignature: () => undefined,
    data: {
      to: params[0],
      value: params[1],
      data: params[2],
      operation: params[3],
      safeTxGas: params[4],
      baseGas: params[5],
      gasPrice: params[6],
      gasToken: params[7],
      refundReceiver: params[8],
      nonce: -1,
    },
    signatures: new Map(),
  }
}

export const ExecTransaction = ({
  data,
  isConfirmationView = false,
}: {
  data?: TransactionData | null
  isConfirmationView?: boolean
}) => {
  const chain = useCurrentChain()
  const spaceId = useUrlSpaceId()

  const childSafeTx = useMemo<SafeTransaction | undefined>(
    () => (data?.hexData ? extractTransactionData(data.hexData) : undefined),
    [data?.hexData],
  )

  const [txPreview, error] = useTxPreview(
    childSafeTx
      ? {
          operation: Number(childSafeTx.data.operation),
          data: childSafeTx.data.data,
          to: childSafeTx.data.to,
          value: childSafeTx.data.value.toString(),
        }
      : undefined,
    data?.to.value,
  )

  const decodedNestedTxDataBlock = txPreview ? (
    <TxData
      txData={txPreview.txData}
      txInfo={txPreview.txInfo}
      trusted
      imitation={false}
      executingSafeAddress={data?.to.value}
    />
  ) : null

  return (
    <NestedTransaction txData={data} isConfirmationView={isConfirmationView}>
      <ExecTransactionView
        decodedNestedTxDataBlock={decodedNestedTxDataBlock}
        openSafeHref={
          chain && data
            ? {
                pathname: AppRoutes.transactions.history,
                query: withSpaceId({ safe: `${chain.shortName}:${data.to.value}` }, spaceId),
              }
            : undefined
        }
        hasError={!!error}
        renderErrorMessage={(children) => <ErrorMessage>{children}</ErrorMessage>}
      />
    </NestedTransaction>
  )
}
