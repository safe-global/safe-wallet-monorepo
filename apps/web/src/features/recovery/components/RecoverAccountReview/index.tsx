import { trackEvent } from '@/services/analytics'
import { RECOVERY_EVENTS } from '@/services/analytics/events/recovery'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import { Separator } from '@/components/ui/separator'
import { Spinner } from '@/components/ui/spinner'
import { useContext, useEffect, useState } from 'react'
import type { ReactElement } from 'react'

import useSafeInfo from '@/hooks/useSafeInfo'
import { getRecoveryProposalTransactions } from '../../services/transaction'
import ErrorMessage from '@/components/tx/ErrorMessage'
import ConfirmationTitle, { ConfirmationTitleTypes } from '@/components/tx/shared/ConfirmationTitle'
import TxCard from '@/components/tx-flow/common/TxCard'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import CheckWallet from '@/components/common/CheckWallet'
import { dispatchRecoveryProposal } from '../../services/recovery-sender'
import { createMultiSendCallOnlyTx, createTx } from '@/services/tx/tx-sender'
import { OwnerList } from '@/components/tx-flow/common/OwnerList'
import { selectDelayModifierByRecoverer } from '../../services/selectors'
import useWallet from '@/hooks/wallets/useWallet'
import useOnboard from '@/hooks/wallets/useOnboard'
import { TxModalContext } from '@/components/tx-flow'
import { asError } from '@safe-global/utils/services/exceptions/utils'
import { trackError, Errors } from '@/services/exceptions'
import { getPeriod } from '@safe-global/utils/utils/date'
import useRecovery from '../../hooks/useRecovery'
import { useIsValidRecoveryExecTransactionFromModule } from '../../hooks/useIsValidRecoveryExecution'
import { isWalletRejection } from '@/utils/wallets'
import WalletRejectionError from '@/components/tx/shared/errors/WalletRejectionError'

import commonCss from '@/components/tx-flow/common/styles.module.css'
import { BalanceChanges } from '@/components/tx/security/BalanceChanges'
import NetworkWarning from '@/components/new-safe/create/NetworkWarning'
import useTxPreview from '@/components/tx/confirmation-views/useTxPreview'
import Summary from '@/components/transactions/TxDetails/Summary'
import useGasPrice from '@/hooks/useGasPrice'
import { useCurrentChain } from '@/hooks/useChains'
import { FEATURES, hasFeature } from '@safe-global/utils/utils/chains'
import type { AddressInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'

type RecoverAccountReviewProps = {
  threshold: string
  owners: AddressInfo[]
}

function RecoverAccountReview({ threshold, owners }: RecoverAccountReviewProps): ReactElement | null {
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

  const [txPreview] = useTxPreview(safeTx?.data)

  // Proposal
  const newThreshold = Number(threshold)
  const newOwners = owners

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
        <Typography className="mb-2">
          This transaction will reset the Account setup, changing the signers
          {newThreshold !== safe.threshold ? ' and threshold' : ''}.
        </Typography>

        <OwnerList owners={newOwners} />

        <Separator className={commonCss.nestedDivider} style={{ marginTop: 'var(--space-2)' }} />

        <div className="my-2">
          <Typography variant="paragraph-small" color="muted" className="block mb-2">
            After recovery, Safe account transactions will require:
          </Typography>
          <Typography>
            <b>{threshold}</b> out of <b>{owners.length} signers.</b>
          </Typography>
        </div>

        <Separator className={commonCss.nestedDivider} />

        {txPreview && <Summary safeTxData={safeTx?.data} {...txPreview} />}

        <BalanceChanges />

        <Separator className="mx-[calc(-1*var(--space-3))] mt-4" />

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
            {recovery.delay === 0n ? 'immediately possible' : `possible in ${getPeriod(Number(recovery.delay))}`} after
            this transaction is executed.
          </ErrorMessage>
        )}

        {isRejectedByUser && <WalletRejectionError />}

        <Separator className={commonCss.nestedDivider} />

        <div className="flex items-center p-2" style={{ marginTop: 'var(--space-1)' }}>
          <CheckWallet allowNonOwner checkNetwork>
            {(isOk) => (
              <Button data-testid="execute-btn" variant="default" disabled={!isOk || submitDisabled} onClick={onSubmit}>
                {!isSubmittable ? <Spinner className="size-5" /> : 'Execute'}
              </Button>
            )}
          </CheckWallet>
        </div>
      </TxCard>
    </>
  )
}

export default RecoverAccountReview
