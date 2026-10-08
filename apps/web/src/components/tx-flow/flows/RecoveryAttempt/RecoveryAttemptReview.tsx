import { type SyntheticEvent, useContext, useCallback, useEffect } from 'react'
import CheckWallet from '@/components/common/CheckWallet'
import { Errors, trackError } from '@/services/exceptions'
import { dispatchRecoveryExecution } from '@/features/recovery/services'
import useWallet from '@/hooks/wallets/useWallet'
import useSafeInfo from '@/hooks/useSafeInfo'
import { TxModalContext } from '@/components/tx-flow'
import NetworkWarning from '@/components/new-safe/create/NetworkWarning'
import { RecoveryFeature } from '@/features/recovery'
import type { RecoveryQueueItem } from '@/features/recovery'
import { useLoadFeature } from '@/features/__core__'
import { useAsyncCallback } from '@safe-global/utils/hooks/useAsync'
import EthHashInfo from '@/components/common/EthHashInfo'
import { SafeTxContext } from '../../SafeTxProvider'
import useGasPrice from '@/hooks/useGasPrice'
import { useCurrentChain } from '@/hooks/useChains'
import { FEATURES, hasFeature } from '@safe-global/utils/utils/chains'
import { RecoveryAttemptReviewView } from '@views/components/tx-flow/flows/RecoveryAttempt/RecoveryAttemptReviewView'

type RecoveryAttemptReviewProps = {
  item: RecoveryQueueItem
}

const RecoveryAttemptReview = ({ item }: RecoveryAttemptReviewProps) => {
  const { RecoveryDescription, RecoveryValidationErrors } = useLoadFeature(RecoveryFeature)
  const { asyncCallback, isLoading, error } = useAsyncCallback(dispatchRecoveryExecution)
  const wallet = useWallet()
  const { safe } = useSafeInfo()
  const { setTxFlow } = useContext(TxModalContext)
  const { setNonceNeeded } = useContext(SafeTxContext)
  const [gasPrice] = useGasPrice()
  const chain = useCurrentChain()

  const onFormSubmit = useCallback(
    async (e: SyntheticEvent) => {
      e.preventDefault()

      if (!wallet || !gasPrice) return

      const isEIP1559 = chain && hasFeature(chain, FEATURES.EIP1559)
      const overrides = isEIP1559
        ? {
            maxFeePerGas: gasPrice?.maxFeePerGas?.toString(),
            maxPriorityFeePerGas: gasPrice?.maxPriorityFeePerGas?.toString(),
          }
        : { gasPrice: gasPrice?.maxFeePerGas?.toString() }

      try {
        await asyncCallback({
          provider: wallet.provider,
          chainId: safe.chainId,
          args: item.args,
          delayModifierAddress: item.address,
          signerAddress: wallet.address,
          overrides,
        })
        setTxFlow(undefined)
      } catch (err) {
        trackError(Errors._812, err)
      }
    },
    [wallet, gasPrice, chain, asyncCallback, safe.chainId, item.args, item.address, setTxFlow],
  )

  useEffect(() => {
    setNonceNeeded(false)
  }, [setNonceNeeded])

  return (
    <RecoveryAttemptReviewView
      onSubmit={onFormSubmit}
      executor={item.executor}
      renderAddress={(props) => <EthHashInfo {...props} />}
      recoveryDescription={<RecoveryDescription item={item} />}
      networkWarning={<NetworkWarning />}
      validationErrors={<RecoveryValidationErrors item={item} />}
      error={error}
      isLoading={isLoading}
      renderCheckWallet={(render) => <CheckWallet allowNonOwner>{render}</CheckWallet>}
    />
  )
}

export default RecoveryAttemptReview
