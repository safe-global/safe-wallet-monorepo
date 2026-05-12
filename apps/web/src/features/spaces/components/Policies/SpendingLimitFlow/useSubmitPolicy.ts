import { useState } from 'react'
import useChains from '@/hooks/useChains'
import useWallet from '@/hooks/wallets/useWallet'
import { useSafesGetSafeV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { createMultiSendCallOnlyTx } from '@/services/tx/tx-sender/create'
import { dispatchTxProposal, dispatchTxSigning } from '@/services/tx/tx-sender/dispatch'
import { asError } from '@safe-global/utils/services/exceptions/utils'
import { buildSpendingLimitBatch, type BatchToken, type Period } from './buildBatch'

type SubmitInput = {
  delegate: string
  amountUsd: number
  period: Period
  tokens: BatchToken[]
}

type UseSubmitPolicyArgs = {
  chainId: string
  safeAddress: string
}

export const useSubmitPolicy = ({ chainId, safeAddress }: UseSubmitPolicyArgs) => {
  const { configs: chains } = useChains()
  const wallet = useWallet()
  const { data: safeInfo } = useSafesGetSafeV1Query({ chainId, safeAddress }, { skip: !chainId || !safeAddress })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (input: SubmitInput): Promise<string | null> => {
    setIsSubmitting(true)
    setError(null)
    try {
      if (!wallet?.provider || !wallet.address) {
        throw new Error('Connect a wallet to sign the policy')
      }
      if (!safeInfo) {
        throw new Error('Safe info still loading')
      }

      const chain = chains.find((c) => c.chainId === chainId)
      if (!chain) {
        throw new Error(`Chain ${chainId} is not supported`)
      }

      const { txs } = await buildSpendingLimitBatch({
        chain,
        chainId,
        delegate: input.delegate,
        amountUsd: input.amountUsd,
        period: input.period,
        tokens: input.tokens,
        safeModules: safeInfo.modules ?? [],
        safeDeployed: true,
      })

      const safeTx = await createMultiSendCallOnlyTx(txs)
      const signed = await dispatchTxSigning(safeTx, wallet.provider)
      const proposed = await dispatchTxProposal({
        chainId,
        safeAddress,
        sender: wallet.address,
        safeTx: signed,
      })

      return proposed?.txId ?? null
    } catch (e) {
      setError(asError(e).message)
      return null
    } finally {
      setIsSubmitting(false)
    }
  }

  return { submit, isSubmitting, error, isReady: !!wallet?.address && !!safeInfo }
}
