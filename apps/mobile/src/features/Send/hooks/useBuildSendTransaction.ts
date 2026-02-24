import { useCallback, useEffect, useState } from 'react'
import { isAddress, getAddress } from 'ethers'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { safeParseUnits } from '@safe-global/utils/utils/formatters'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import { createTx } from '@/src/services/tx/tx-sender/create'
import { createErc20TransferParams } from '../services/tokenTransferParams'
import {
  useTransactionsPreviewTransactionV1Mutation,
  type TransactionPreview,
} from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import type { SafeTransaction } from '@safe-global/types-kit'

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

interface UseBuildSendTransactionArgs {
  recipientAddress: string
  tokenAddress: string
  amount: string
  decimals: number
}

interface UseBuildSendTransactionResult {
  safeTx: SafeTransaction | undefined
  preview: TransactionPreview | undefined
  isLoading: boolean
  error: string | undefined
  build: () => Promise<void>
}

export function useBuildSendTransaction({
  recipientAddress,
  tokenAddress,
  amount,
  decimals,
}: UseBuildSendTransactionArgs): UseBuildSendTransactionResult {
  const activeSafe = useDefinedActiveSafe()
  const [safeTx, setSafeTx] = useState<SafeTransaction>()
  const [preview, setPreview] = useState<TransactionPreview>()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>()
  const [triggerPreview] = useTransactionsPreviewTransactionV1Mutation()

  const build = useCallback(async () => {
    setIsLoading(true)
    setError(undefined)

    try {
      if (!isAddress(recipientAddress)) {
        throw new Error('Invalid recipient address')
      }
      if (!isAddress(tokenAddress)) {
        throw new Error('Invalid token address')
      }

      const parsedAmount = safeParseUnits(amount, decimals)
      if (parsedAmount === undefined) {
        throw new Error(`Failed to parse amount "${amount}"`)
      }

      const isNative = sameAddress(tokenAddress, ZERO_ADDRESS)
      const txData = isNative
        ? { to: getAddress(recipientAddress), value: parsedAmount.toString(), data: '0x' }
        : createErc20TransferParams(getAddress(recipientAddress), getAddress(tokenAddress), parsedAmount.toString())

      const tx = await createTx(txData)
      setSafeTx(tx)

      const previewResult = await triggerPreview({
        chainId: activeSafe.chainId,
        safeAddress: activeSafe.address,
        previewTransactionDto: {
          to: txData.to,
          value: txData.value ?? '0',
          data: txData.data ?? null,
          operation: 0,
        },
      }).unwrap()

      setPreview(previewResult)
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to build transaction'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [recipientAddress, tokenAddress, amount, decimals, activeSafe.chainId, activeSafe.address, triggerPreview])

  useEffect(() => {
    if (recipientAddress && tokenAddress && amount) {
      build()
    }
  }, [build, recipientAddress, tokenAddress, amount])

  return { safeTx, preview, isLoading, error, build }
}
