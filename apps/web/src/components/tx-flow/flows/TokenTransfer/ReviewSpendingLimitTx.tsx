import useWallet from '@/hooks/wallets/useWallet'
import type { ReactElement, SyntheticEvent } from 'react'
import { useContext, useMemo, useState } from 'react'
import { type BigNumberish, type BytesLike } from 'ethers'
import { Button, CardActions, Typography } from '@mui/material'
import SendToBlock from '@/components/tx/SendToBlock'
import { type TokenTransferParams } from '@/components/tx-flow/flows/TokenTransfer/index'
import SendAmountBlock from '@/components/tx-flow/flows/TokenTransfer/SendAmountBlock'
import useBalances from '@/hooks/useBalances'
import useSpendingLimit from '@/hooks/useSpendingLimit'
import useSpendingLimitGas from '@/hooks/useSpendingLimitGas'
import AdvancedParams, { useAdvancedParams } from '@/components/tx/AdvancedParams'
import { EMPTY_DATA, ZERO_ADDRESS } from '@safe-global/protocol-kit/dist/src/utils/constants'
import useSafeInfo from '@/hooks/useSafeInfo'
import { Errors, logError } from '@/services/exceptions'
import ErrorMessage from '@/components/tx/ErrorMessage'
import WalletRejectionError from '@/components/tx/SignOrExecuteForm/WalletRejectionError'
import { useCurrentChain } from '@/hooks/useChains'
import { dispatchSpendingLimitTxExecution } from '@/services/tx/tx-sender'
import { getTxOptions } from '@/utils/transactions'
import { MODALS_EVENTS, trackEvent } from '@/services/analytics'
import useOnboard from '@/hooks/wallets/useOnboard'
import { asError } from '@safe-global/utils/services/exceptions/utils'
import TxCard from '@/components/tx-flow/common/TxCard'
import { TxModalContext } from '@/components/tx-flow'
import { type SubmitCallback } from '@/components/tx/SignOrExecuteForm/SignOrExecuteForm'
import { TX_EVENTS, TX_TYPES } from '@/services/analytics/events/transactions'
import { isWalletRejection } from '@/utils/wallets'
import { safeParseUnits } from '@safe-global/utils/utils/formatters'
import CheckWallet from '@/components/common/CheckWallet'
import NetworkWarning from '@/components/new-safe/create/NetworkWarning'

export type SpendingLimitTxParams = {
  safeAddress: string
  token: string
  to: string
  amount: BigNumberish
  paymentToken: string
  payment: BigNumberish
  delegate: string
  signature: BytesLike
}

const ReviewSpendingLimitTx = ({
  params,
  onSubmit,
}: {
  params: TokenTransferParams
  onSubmit: SubmitCallback
}): ReactElement => {
  const [isSubmittable, setIsSubmittable] = useState<boolean>(true)
  const [submitError, setSubmitError] = useState<Error | undefined>()
  const [isRejectedByUser, setIsRejectedByUser] = useState<Boolean>(false)
  const { setTxFlow } = useContext(TxModalContext)
  const currentChain = useCurrentChain()
  const onboard = useOnboard()
  const wallet = useWallet()
  const { safe, safeAddress } = useSafeInfo()
  const { balances } = useBalances()
  const token = balances.items.find((item) => item.tokenInfo.address === params.tokenAddress)
  const spendingLimit = useSpendingLimit(token?.tokenInfo)

  const amountInWei = useMemo(
    () => safeParseUnits(params.amount, token?.tokenInfo.decimals)?.toString() || '0',
    [params.amount, token?.tokenInfo.decimals],
  )

  const txParams: SpendingLimitTxParams = useMemo(
    () => ({
      safeAddress,
      token: spendingLimit?.token.address || ZERO_ADDRESS,
      to: params.recipient,
      amount: amountInWei,
      paymentToken: ZERO_ADDRESS,
      payment: 0,
      delegate: spendingLimit?.beneficiary || ZERO_ADDRESS,
      signature: EMPTY_DATA,
    }),
    [amountInWei, params.recipient, safeAddress, spendingLimit?.beneficiary, spendingLimit?.token],
  )

  const { gasLimit, gasLimitLoading } = useSpendingLimitGas(txParams)

  const [advancedParams, setManualParams] = useAdvancedParams(gasLimit)

  const handleSubmit = async (e: SyntheticEvent) => {
    e.preventDefault()
    if (!onboard || !wallet) return

    trackEvent(MODALS_EVENTS.USE_SPENDING_LIMIT)

    setIsSubmittable(false)
    setSubmitError(undefined)
    setIsRejectedByUser(false)

    const txOptions = getTxOptions(advancedParams, currentChain)

    try {
      await dispatchSpendingLimitTxExecution(
        txParams,
        txOptions,
        wallet.provider,
        safe.chainId,
        safeAddress,
        safe.modules,
      )
      onSubmit('', true)
      setTxFlow(undefined)
    } catch (_err) {
      const err = asError(_err)
      if (isWalletRejection(err)) {
        setIsRejectedByUser(true)
      } else {
        logError(Errors._801, err)
        setSubmitError(err)
      }
      setIsSubmittable(true)
      return
    }

    trackEvent({ ...TX_EVENTS.CREATE_VIA_SPENDING_LIMTI, label: TX_TYPES.transfer_token })
    trackEvent({ ...TX_EVENTS.EXECUTE_VIA_SPENDING_LIMIT, label: TX_TYPES.transfer_token })
  }

  const submitDisabled = !isSubmittable || gasLimitLoading

  return (
    <form onSubmit={handleSubmit}>
      <TxCard>
        <Typography variant="body2">
          Spending limit transactions only appear in the interface once they are successfully processed and indexed.
          Pending transactions can only be viewed in your signer wallet application or under your wallet address on a
          Blockchain Explorer.
        </Typography>

        {token && <SendAmountBlock amountInWei={amountInWei} tokenInfo={token.tokenInfo} />}

        <SendToBlock address={params.recipient} />

        <AdvancedParams params={advancedParams} willExecute={true} onFormSubmit={setManualParams} />

        <NetworkWarning />

        {submitError && (
          <ErrorMessage error={submitError}>Error submitting the transaction. Please try again.</ErrorMessage>
        )}

        {isRejectedByUser && <WalletRejectionError />}

        <Typography variant="body2" color="primary.light" textAlign="center">
          You&apos;re about to create a transaction and will need to confirm it with your currently connected wallet.
        </Typography>

        <CardActions>
          <CheckWallet allowNonOwner checkNetwork={!submitDisabled}>
            {(isOk) => (
              <Button variant="contained" type="submit" disabled={!isOk || submitDisabled}>
                Execute
              </Button>
            )}
          </CheckWallet>
        </CardActions>
      </TxCard>
    </form>
  )
}

export default ReviewSpendingLimitTx
