import { Safe__factory } from '@safe-global/utils/types/contracts'
import { Box, Skeleton, Stack } from '@mui/material'
import { type TransactionData } from '@safe-global/safe-gateway-typescript-sdk'
import ErrorMessage from '@/components/tx/ErrorMessage'

import Link from 'next/link'
import { useCurrentChain } from '@/hooks/useChains'
import { AppRoutes } from '@/config/routes'
import { useMemo } from 'react'
import type { SafeTransaction } from '@safe-global/types-kit'
import ExternalLink from '@/components/common/ExternalLink'
import { NestedTransaction } from '../NestedTransaction'
import useTxPreview from '@/components/tx/confirmation-views/useTxPreview'
import TxData from '../..'
import { TxSimulation, TxSimulationMessage } from '@/components/tx/security/tenderly'
import useSafeAddress from '@/hooks/useSafeAddress'

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
  const safeAddress = useSafeAddress()

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
    <TxData txData={txPreview.txData} txInfo={txPreview.txInfo} trusted imitation={false} />
  ) : null

  return (
    <NestedTransaction txData={data} isConfirmationView={isConfirmationView}>
      {decodedNestedTxDataBlock ? (
        <>
          {decodedNestedTxDataBlock}

          {isConfirmationView && childSafeTx && data?.to.value && (
            <Stack spacing={2}>
              <TxSimulation
                disabled={false}
                transactions={childSafeTx}
                title="Simulate nested transaction"
                executionOwner={safeAddress}
                nestedSafe={data?.to.value}
              />
              <TxSimulationMessage isNested />
            </Stack>
          )}

          {chain && data && (
            <Box>
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
            </Box>
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
