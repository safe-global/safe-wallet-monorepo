import { type SyntheticEvent, useContext, useCallback, useEffect } from 'react'
import { CircularProgress, CardActions, Button, Typography, Stack, Divider } from '@mui/material'
import CheckWallet from '@/components/common/CheckWallet'
import { Errors, trackError } from '@/services/exceptions'
import { dispatchRecoveryExecution } from '@/features/recovery/services/recovery-sender'
import useWallet from '@/hooks/wallets/useWallet'
import useSafeInfo from '@/hooks/useSafeInfo'
import ErrorMessage from '@/components/tx/ErrorMessage'
import TxCard from '@/components/tx-flow/common/TxCard'
import { TxModalContext } from '@/components/tx-flow'
import NetworkWarning from '@/components/new-safe/create/NetworkWarning'
import { RecoveryValidationErrors } from '@/features/recovery/components/RecoveryValidationErrors'
import type { RecoveryQueueItem } from '@/features/recovery/services/recovery-state'
import { RecoveryDescription } from '@/features/recovery/components/RecoveryDescription'
import { useAsyncCallback } from '@/hooks/useAsync'
import FieldsGrid from '@/components/tx/FieldsGrid'
import EthHashInfo from '@/components/common/EthHashInfo'
import { SafeTxContext } from '../../SafeTxProvider'
import useGasPrice from '@/hooks/useGasPrice'
import { useCurrentChain } from '@/hooks/useChains'
import { hasFeature, FEATURES } from '@/utils/chains'

type RecoveryAttemptReviewProps = {
  item: RecoveryQueueItem
}

const RecoveryAttemptReview = ({ item }: RecoveryAttemptReviewProps) => {
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
        <Stack
          sx={{
            gap: 3,
            mb: 2,
          }}
        >
          <Typography>Execute this transaction to finalize the recovery.</Typography>

          <FieldsGrid title="Initiator">
            <EthHashInfo address={item.executor} showName showCopyButton hasExplorer />
          </FieldsGrid>

          <Divider sx={{ mx: -3 }} />

          <RecoveryDescription item={item} />

          <NetworkWarning />

          <RecoveryValidationErrors item={item} />

          {error && <ErrorMessage error={error}>Error submitting the transaction.</ErrorMessage>}
        </Stack>

        <Divider sx={{ mx: -3, my: 3.5 }} />

        <CardActions>
          {/* Submit button, also available to non-owner role members */}
          <CheckWallet allowNonOwner>
            {(isOk) => (
              <Button
                data-testid="execute-through-role-form-btn"
                variant="contained"
                type="submit"
                disabled={!isOk || isLoading}
                sx={{ minWidth: '112px' }}
              >
                {isLoading ? <CircularProgress size={20} /> : 'Execute'}
              </Button>
            )}
          </CheckWallet>
        </CardActions>
      </form>
    </TxCard>
  )
}

export default RecoveryAttemptReview
