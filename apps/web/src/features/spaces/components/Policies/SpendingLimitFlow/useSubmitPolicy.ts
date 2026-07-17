import { useState } from 'react'
import type { MetaTransactionData } from '@safe-global/types-kit'
import useChains from '@/hooks/useChains'
import useWallet from '@/hooks/wallets/useWallet'
import { useSafesGetSafeV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { asError } from '@safe-global/utils/services/exceptions/utils'
import { buildSpendingLimitBatch, type BatchToken, type Period } from './buildBatch'

type BuildInput = {
  delegate: string
  amountUsd: number
  period: Period
  tokens: BatchToken[]
}

type UseSubmitPolicyArgs = {
  chainId: string
  safeAddress: string
}

/**
 * Builds the spending-limit multi-send batch but stops short of signing — the
 * wizard hands the batch off to the standard tx-flow modal, which then renders
 * the review screen with Safe Shield, simulation, and sign/propose machinery.
 */
export const useSubmitPolicy = ({ chainId, safeAddress }: UseSubmitPolicyArgs) => {
  const { configs: chains } = useChains()
  const wallet = useWallet()
  const { data: safeInfo } = useSafesGetSafeV1Query({ chainId, safeAddress }, { skip: !chainId || !safeAddress })

  const [error, setError] = useState<string | null>(null)
  const [isPreparing, setIsPreparing] = useState(false)

  const buildTxs = async (input: BuildInput): Promise<MetaTransactionData[] | null> => {
    setError(null)
    setIsPreparing(true)
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
        safeAddress,
        safeVersion: safeInfo.version ?? '1.3.0',
        delegate: input.delegate,
        amountUsd: input.amountUsd,
        period: input.period,
        tokens: input.tokens,
        safeModules: safeInfo.modules ?? [],
        safeDeployed: true,
      })

      return txs
    } catch (e) {
      setError(asError(e).message)
      return null
    } finally {
      setIsPreparing(false)
    }
  }

  return { buildTxs, isPreparing, error, isReady: !!wallet?.address && !!safeInfo }
}
