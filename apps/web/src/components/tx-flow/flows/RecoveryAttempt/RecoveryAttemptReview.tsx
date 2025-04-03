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
import { useAsyncCallback } from '@safe-global/utils/hooks/useAsync'
import FieldsGrid from '@/components/tx/FieldsGrid'
import EthHashInfo from '@/components/common/EthHashInfo'
import { SafeTxContext } from '../../SafeTxProvider'

type RecoveryAttemptReviewProps = {
  item: RecoveryQueueItem
}

const RecoveryAttemptReview = ({ item }: RecoveryAttemptReviewProps) => {
  const { asyncCallback, isLoading, error } = useAsyncCallback(dispatchRecoveryExecution)
  const wallet = useWallet()
  const { safe } = useSafeInfo()
  const { setTxFlow } = useContext(TxModalContext)
  const { setNonceNeeded } = useContext(SafeTxContext)

  const onFormSubmit = useCallback(
    async (e: SyntheticEvent) => {
      e.preventDefault()

      if (!wallet) return

      try {
        await asyncCallback({
          provider: wallet.provider,
          chainId: safe.chainId,
          args: item.args,
          delayModifierAddress: item.address,
          signerAddress: wallet.address,
        })
        setTxFlow(undefined)
      } catch (err) {
        trackError(Errors._812, err)
      }
    },
    [asyncCallback, setTxFlow, wallet, safe, item.address, item.args],
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
