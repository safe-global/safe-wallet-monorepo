import { trackEvent } from '@/services/analytics'
import { RECOVERY_EVENTS } from '@/services/analytics/events/recovery'
import { useContext, useEffect, useState } from 'react'
import type { ReactElement } from 'react'

import useSafeInfo from '@/hooks/useSafeInfo'
import { getRecoveryProposalTransactions } from '../../services/transaction'
import TxCheckError from '@/components/tx/TxCheckError'
import TxSubmitError from '@/components/tx/TxSubmitError'
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
import useRecovery from '../../hooks/useRecovery'
import { useIsValidRecoveryExecTransactionFromModule } from '../../hooks/useIsValidRecoveryExecution'
import { isWalletRejection } from '@/utils/wallets'
import WalletRejectionError from '@/components/tx/shared/errors/WalletRejectionError'

import { BalanceChanges } from '@/components/tx/security/BalanceChanges'
import NetworkWarning from '@/components/new-safe/create/NetworkWarning'
import useTxPreview from '@/components/tx/confirmation-views/useTxPreview'
import Summary from '@/components/transactions/TxDetails/Summary'
import useGasPrice from '@/hooks/useGasPrice'
import { useCurrentChain } from '@/hooks/useChains'
import { FEATURES, hasFeature } from '@safe-global/utils/utils/chains'
import type { AddressInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { RecoverAccountReviewView } from '@views/features/recovery/components/RecoverAccountReview/RecoverAccountReviewView'

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
    <RecoverAccountReviewView
      threshold={threshold}
      ownersCount={owners.length}
      isThresholdChanged={newThreshold !== safe.threshold}
      recoveryDelay={recovery?.delay}
      isSubmittable={isSubmittable}
      submitDisabled={submitDisabled}
      onSubmit={onSubmit}
      ownerList={<OwnerList owners={newOwners} />}
      summary={txPreview && <Summary safeTxData={safeTx?.data} {...txPreview} />}
      balanceChanges={<BalanceChanges />}
      errors={
        <>
          {safeTxError && <TxCheckError error={safeTxError} />}

          {executionValidationError && <TxCheckError error={executionValidationError} />}

          {submitError && <TxSubmitError error={submitError} />}

          <NetworkWarning />
        </>
      }
      walletRejection={!!isRejectedByUser && <WalletRejectionError />}
      renderCheckWallet={(children) => (
        <CheckWallet allowNonOwner checkNetwork>
          {children}
        </CheckWallet>
      )}
    />
  )
}

export default RecoverAccountReview
