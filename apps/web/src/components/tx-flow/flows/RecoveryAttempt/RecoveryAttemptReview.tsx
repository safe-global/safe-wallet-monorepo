import { type SyntheticEvent, useContext, useCallback, useEffect } from 'react'
import CheckWallet from '@/components/common/CheckWallet'
import { Errors, trackError } from '@/services/exceptions'
import { dispatchRecoveryExecution } from '@/features/recovery/services'
import useWallet from '@/hooks/wallets/useWallet'
import useSafeInfo from '@/hooks/useSafeInfo'
import ErrorMessage from '@/components/tx/ErrorMessage'
import TxCard from '@/components/tx-flow/common/TxCard'
import { TxModalContext } from '@/components/tx-flow'
import NetworkWarning from '@/components/new-safe/create/NetworkWarning'
import { RecoveryFeature } from '@/features/recovery'
import type { RecoveryQueueItem } from '@/features/recovery'
import { useLoadFeature } from '@/features/__core__'
import { useAsyncCallback } from '@safe-global/utils/hooks/useAsync'
import FieldsGrid from '@/components/tx/FieldsGrid'
import EthHashInfo from '@/components/common/EthHashInfo'
import { SafeTxContext } from '../../SafeTxProvider'
import useGasPrice from '@/hooks/useGasPrice'
import { useCurrentChain } from '@/hooks/useChains'
import { FEATURES, hasFeature } from '@safe-global/utils/utils/chains'
import { Typography } from '@/components/ui/typography'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Spinner } from '@/components/ui/spinner'

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
    <TxCard>
      <form onSubmit={onFormSubmit}>
        <div className="mb-4 flex flex-col gap-6">
          <Typography>Execute this transaction to finalize the recovery.</Typography>

          <FieldsGrid title="Initiator">
            <EthHashInfo address={item.executor} showName showCopyButton hasExplorer />
          </FieldsGrid>

          <Separator className="-mx-6" />

          <RecoveryDescription item={item} />

          <NetworkWarning />

          <RecoveryValidationErrors item={item} />

          {error && <ErrorMessage error={error}>Error submitting the transaction.</ErrorMessage>}
        </div>

        <Separator className="-mx-6 my-7" />

        <div className="flex items-center">
          {/* Submit button, also available to non-owner role members */}
          <CheckWallet allowNonOwner>
            {(isOk) => (
              <Button
                data-testid="execute-through-role-form-btn"
                variant="default"
                size="submit"
                type="submit"
                disabled={!isOk || isLoading}
              >
                {isLoading ? <Spinner className="size-5" /> : 'Execute'}
              </Button>
            )}
          </CheckWallet>
        </div>
      </form>
    </TxCard>
  )
}

export default RecoveryAttemptReview
