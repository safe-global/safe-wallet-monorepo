import { trackEvent } from '@/services/analytics'
import { RECOVERY_EVENTS } from '@/services/analytics/events/recovery'
import { CardActions, Button, Typography, Divider, Box, CircularProgress } from '@mui/material'
import { useContext, useEffect, useState } from 'react'
import type { ReactElement } from 'react'

import useSafeInfo from '@/hooks/useSafeInfo'
import { getRecoveryProposalTransactions } from '@/features/recovery/services/transaction'
import ErrorMessage from '@/components/tx/ErrorMessage'
import ConfirmationTitle, { ConfirmationTitleTypes } from '@/components/tx/SignOrExecuteForm/ConfirmationTitle'
import TxChecks from '@/components/tx-flow/features/TxChecks/TxChecks'
import TxCard from '../../common/TxCard'
import { SafeTxContext } from '../../SafeTxProvider'
import CheckWallet from '@/components/common/CheckWallet'
import { dispatchRecoveryProposal } from '@/features/recovery/services/recovery-sender'
import { createMultiSendCallOnlyTx, createTx } from '@/services/tx/tx-sender'
import { RecoverAccountFlowFields } from '.'
import { OwnerList } from '../../common/OwnerList'
import { selectDelayModifierByRecoverer } from '@/features/recovery/services/selectors'
import useWallet from '@/hooks/wallets/useWallet'
import useOnboard from '@/hooks/wallets/useOnboard'
import { TxModalContext } from '../..'
import { asError } from '@safe-global/utils/services/exceptions/utils'
import { trackError, Errors } from '@/services/exceptions'
import { getPeriod } from '@safe-global/utils/utils/date'
import useRecovery from '@/features/recovery/hooks/useRecovery'
import { useIsValidRecoveryExecTransactionFromModule } from '@/features/recovery/hooks/useIsValidRecoveryExecution'
import type { RecoverAccountFlowProps } from '.'
import { isWalletRejection } from '@/utils/wallets'
import WalletRejectionError from '@/components/tx/SignOrExecuteForm/WalletRejectionError'

import commonCss from '@/components/tx-flow/common/styles.module.css'
import { BlockaidBalanceChanges } from '@/components/tx/security/blockaid/BlockaidBalanceChange'
import NetworkWarning from '@/components/new-safe/create/NetworkWarning'
import { useGetTransactionDetailsQuery } from '@/store/api/gateway'
import { skipToken } from '@reduxjs/toolkit/query'
import useTxPreview from '@/components/tx/confirmation-views/useTxPreview'
import Summary from '@/components/transactions/TxDetails/Summary'
import useGasPrice from '@/hooks/useGasPrice'
import { useCurrentChain } from '@/hooks/useChains'
import { FEATURES, hasFeature } from '@safe-global/utils/utils/chains'

export function RecoverAccountFlowReview({ params }: { params: RecoverAccountFlowProps }): ReactElement | null {
  // Form state
  const [isSubmittable, setIsSubmittable] = useState<boolean>(true)
  const [submitError, setSubmitError] = useState<Error | undefined>()
  const [isRejectedByUser, setIsRejectedByUser] = useState<Boolean>(false)

  // Hooks
  const { setTxFlow } = useContext(TxModalContext)
  const { safeTx, safeTxError, setSafeTx, setSafeTxError } = useContext(SafeTxContext)
  const { safe } = useSafeInfo()
  const wallet = useWallet()
  const onboard = useOnboard()
  const [data] = useRecovery()
  const recovery = data && selectDelayModifierByRecoverer(data, wallet?.address ?? '')
  const [, executionValidationError] = useIsValidRecoveryExecTransactionFromModule(recovery?.address, safeTx)
  const [gasPrice] = useGasPrice()
  const chain = useCurrentChain()

  const { data: txDetails } = useGetTransactionDetailsQuery(skipToken)
  const [txPreview] = useTxPreview(safeTx?.data, undefined, txDetails?.txId)

  // Proposal
  const newThreshold = Number(params[RecoverAccountFlowFields.threshold])
  const newOwners = params[RecoverAccountFlowFields.owners]

  useEffect(() => {
    const transactions = getRecoveryProposalTransactions({
      safe,
      newThreshold,
      newOwners,
    })

    const promise = transactions.length > 1 ? createMultiSendCallOnlyTx(transactions) : createTx(transactions[0])

    promise.then(setSafeTx).catch(setSafeTxError)
  }, [newThreshold, newOwners, safe, setSafeTx, setSafeTxError])

  // On modal submit
  const onSubmit = async () => {
    if (!recovery || !onboard || !wallet || !safeTx || !gasPrice) {
      return
    }

    setIsSubmittable(false)
    setSubmitError(undefined)
    setIsRejectedByUser(false)

    const isEIP1559 = chain && hasFeature(chain, FEATURES.EIP1559)
    const overrides = isEIP1559
      ? {
          maxFeePerGas: gasPrice?.maxFeePerGas?.toString(),
          maxPriorityFeePerGas: gasPrice?.maxPriorityFeePerGas?.toString(),
        }
      : { gasPrice: gasPrice?.maxFeePerGas?.toString() }

    try {
      await dispatchRecoveryProposal({
        provider: wallet.provider,
        safe,
        safeTx,
        delayModifierAddress: recovery.address,
        signerAddress: wallet.address,
        overrides,
      })
      trackEvent({ ...RECOVERY_EVENTS.SUBMIT_RECOVERY_ATTEMPT })
    } catch (_err) {
      const err = asError(_err)
      if (isWalletRejection(err)) {
        setIsRejectedByUser(true)
      } else {
        trackError(Errors._804, err)
        setSubmitError(err)
      }
      setIsSubmittable(true)
      return
    }

    setTxFlow(undefined)
  }

  const submitDisabled = !safeTx || !isSubmittable || !recovery

  return (
    <>
      <TxCard>
        <Typography mb={1}>
          This transaction will reset the Account setup, changing the signers
          {newThreshold !== safe.threshold ? ' and threshold' : ''}.
        </Typography>

        <OwnerList owners={newOwners} />

        <Divider className={commonCss.nestedDivider} sx={{ mt: 'var(--space-2) !important' }} />

        <Box my={1}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            After recovery, Safe Account transactions will require:
          </Typography>
          <Typography>
            <b>{params.threshold}</b> out of <b>{params[RecoverAccountFlowFields.owners].length} signers.</b>
          </Typography>
        </Box>

        <Divider className={commonCss.nestedDivider} />

        {txPreview && <Summary txDetails={txDetails} safeTxData={safeTx?.data} {...txPreview} />}

        <BlockaidBalanceChanges />
      </TxCard>

      {safeTx && <TxChecks transaction={safeTx} executionOwner={safe.owners[0].value} />}

      <TxCard>
        <>
          <ConfirmationTitle variant={ConfirmationTitleTypes.execute} />

          {safeTxError && (
            <ErrorMessage error={safeTxError}>
              This recovery will most likely fail. To save gas costs, avoid executing the transaction.
            </ErrorMessage>
          )}

          {executionValidationError && (
            <ErrorMessage error={executionValidationError}>
              This transaction will most likely fail. To save gas costs, avoid executing the transaction.
            </ErrorMessage>
          )}

          {submitError && (
            <ErrorMessage error={submitError}>Error submitting the transaction. Please try again.</ErrorMessage>
          )}

          <NetworkWarning />

          {recovery?.delay !== undefined && (
            <ErrorMessage level="info">
              Recovery will be{' '}
              {recovery.delay === 0n ? 'immediately possible' : `possible in ${getPeriod(Number(recovery.delay))}`}{' '}
              after this transaction is executed.
            </ErrorMessage>
          )}

          {isRejectedByUser && <WalletRejectionError />}

          <Divider className={commonCss.nestedDivider} />

          <CardActions sx={{ mt: 'var(--space-1) !important' }}>
            <CheckWallet allowNonOwner checkNetwork>
              {(isOk) => (
                <Button
                  data-testid="execute-btn"
                  variant="contained"
                  disabled={!isOk || submitDisabled}
                  onClick={onSubmit}
                >
                  {!isSubmittable ? <CircularProgress size={20} /> : 'Execute'}
                </Button>
              )}
            </CheckWallet>
          </CardActions>
        </>
      </TxCard>
    </>
  )
}
