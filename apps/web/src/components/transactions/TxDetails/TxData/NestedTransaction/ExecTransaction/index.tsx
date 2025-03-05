import { Safe__factory } from '@/types/contracts'
import { Skeleton } from '@mui/material'
import { type TransactionData } from '@safe-global/safe-gateway-typescript-sdk'
import ErrorMessage from '@/components/tx/ErrorMessage'

import DecodedTx from '@/components/tx/DecodedTx'
import Link from 'next/link'
import { useCurrentChain } from '@/hooks/useChains'
import { AppRoutes } from '@/config/routes'
import { useMemo } from 'react'
import type { SafeTransaction } from '@safe-global/safe-core-sdk-types'
import ExternalLink from '@/components/common/ExternalLink'
import { NestedTransaction } from '../NestedTransaction'
import useTxPreview from '@/components/tx/confirmation-views/useTxPreview'

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
  data?: TransactionData
  isConfirmationView?: boolean
}) => {
  const chain = useCurrentChain()

  const childSafeTx = useMemo<SafeTransaction | undefined>(
    () => (data?.hexData ? extractTransactionData(data.hexData) : undefined),
    [data?.hexData],
  )

  const txData = useMemo(
    () =>
      childSafeTx
        ? {
            operation: Number(childSafeTx.data.operation),
            data: childSafeTx.data.data,
            to: childSafeTx.data.to,
            value: childSafeTx.data.value.toString(),
          }
        : undefined,
    [childSafeTx],
  )

  const [txPreview, error] = useTxPreview(txData, data?.to.value)

  const decodedNestedTxDataBlock = txPreview ? (
    <DecodedTx {...txPreview} tx={childSafeTx} showMethodCall showAdvancedDetails={false} />
  ) : null

  return (
    <NestedTransaction txData={data} isConfirmationView={isConfirmationView}>
      {decodedNestedTxDataBlock ? (
        <>
          {decodedNestedTxDataBlock}

          {chain && data && (
            <Link
              href={{
                pathname: AppRoutes.transactions.history,
                query: { safe: `${chain.shortName}:${data.to.value}` },
              }}
              passHref
              legacyBehavior
            >
              <ExternalLink>Open Safe</ExternalLink>
            </Link>
          )}
        </>
      ) : error ? (
        <ErrorMessage>Could not load details on executed transaction.</ErrorMessage>
      ) : (
        <Skeleton />
      )}
    </NestedTransaction>
  )
}
