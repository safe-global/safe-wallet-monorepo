import useWalletCanPay from '@/hooks/useWalletCanPay'
import madProps from '@/utils/mad-props'
import { type ReactElement, type SyntheticEvent, useContext, useState } from 'react'
import { CircularProgress, Box, Button, CardActions, Divider, Typography } from '@mui/material'

import ErrorMessage from '@/components/tx/ErrorMessage'
import { trackError, Errors } from '@/services/exceptions'
import { useCurrentChain } from '@/hooks/useChains'
import { getTxOptions } from '@/utils/transactions'
import CheckWallet from '@/components/common/CheckWallet'

import type { SignOrExecuteProps } from '@/components/tx/SignOrExecuteForm/SignOrExecuteFormV2'
import type { SafeTransaction } from '@safe-global/safe-core-sdk-types'
import { TxModalContext } from '@/components/tx-flow'
import { SuccessScreenFlow } from '@/components/tx-flow/flows'
import AdvancedParams, { useAdvancedParams } from '../../../../tx/AdvancedParams'
import { asError } from '@safe-global/utils/services/exceptions/utils'
import { isWalletRejection } from '@/utils/wallets'

import css from './styles.module.css'
import commonCss from '@/components/tx-flow/common/styles.module.css'
import { TxSecurityContext } from '@/components/tx/security/shared/TxSecurityContext'

import WalletRejectionError from '@/components/tx/SignOrExecuteForm/WalletRejectionError'
import { pollModuleTransactionId, useExecuteThroughRole, useGasLimit, useMetaTransactions, type Role } from './hooks'
import { decodeBytes32String } from 'ethers'
import useOnboard from '@/hooks/wallets/useOnboard'
import useWallet from '@/hooks/wallets/useWallet'
import useSafeInfo from '@/hooks/useSafeInfo'
import { assertOnboard, assertWallet } from '@/utils/helpers'
import { dispatchModuleTxExecution } from '@/services/tx/tx-sender'
import { Status } from 'zodiac-roles-deployments'

const Role = ({ children }: { children: string }) => {
  let humanReadableRoleKey = children
  try {
    humanReadableRoleKey = decodeBytes32String(children)
  } catch (e) {}

  return <span className={css.roleChip}>{humanReadableRoleKey}</span>
}

export const ExecuteThroughRoleForm = ({
  safeTx,
  role,
  onSubmit,
  disableSubmit = false,
  txSecurity,
}: SignOrExecuteProps & {
  safeTx?: SafeTransaction
  safeTxError?: Error
  role: Role
  txSecurity: ReturnType<typeof useTxSecurityContext>
}): ReactElement => {
  const currentChain = useCurrentChain()
  const onboard = useOnboard()
  const wallet = useWallet()
  const { safe } = useSafeInfo()

  const chainId = currentChain?.chainId || '1'

  const [isPending, setIsPending] = useState<boolean>(false)
  const [isRejectedByUser, setIsRejectedByUser] = useState<boolean>(false)
  const [submitError, setSubmitError] = useState<Error | undefined>()

  const { setTxFlow } = useContext(TxModalContext)
  const { needsRiskConfirmation, isRiskConfirmed, setIsRiskIgnored } = txSecurity

  const permissionsError = role.status !== null ? PermissionsErrorMessage[role.status] : null
  const metaTransactions = useMetaTransactions(safeTx)
  const multiSendImpossible = metaTransactions.length > 1 && !role.multiSend

  // Wrap call, routing it through the Roles mod with the allowing role
  const txThroughRole = useExecuteThroughRole({
    role: role.status === Status.Ok && !multiSendImpossible ? role : undefined,
    metaTransactions,
  })

  // Estimate gas limit
  const { gasLimit, gasLimitError } = useGasLimit(txThroughRole)
  const [advancedParams, setAdvancedParams] = useAdvancedParams(gasLimit)

  // On form submit
  const handleSubmit = async (e: SyntheticEvent) => {
    e.preventDefault()

    if (needsRiskConfirmation && !isRiskConfirmed) {
      setIsRiskIgnored(true)
      return
    }

    assertWallet(wallet)
    assertOnboard(onboard)

    setIsRejectedByUser(false)
    setIsPending(true)
    setSubmitError(undefined)
    setIsRejectedByUser(false)

    if (!txThroughRole) {
      throw new Error('Execution through role is not possible')
    }

    const txOptions = getTxOptions(advancedParams, currentChain)

    let txHash: string
    try {
      txHash = await dispatchModuleTxExecution({ ...txThroughRole, ...txOptions }, wallet.provider, safe.address.value)
    } catch (_err) {
      const err = asError(_err)
      if (isWalletRejection(err)) {
        setIsRejectedByUser(true)
      } else {
        trackError(Errors._815, err)
        setSubmitError(err)
      }
      setIsPending(false)
      return
    }

    // On success, forward to the success screen, initially without a txId
    setTxFlow(<SuccessScreenFlow txHash={txHash} />, undefined, false)

    // Wait for module tx to be indexed
    const transactionService = currentChain?.transactionService
    if (!transactionService) {
      throw new Error('Transaction service not found')
    }
    const txId = await pollModuleTransactionId(chainId, safe.address.value, txHash)
    onSubmit?.(txId, true)

    // Update the success screen so it shows a link to the transaction
    setTxFlow(<SuccessScreenFlow txId={txId} />, undefined, false)
  }

  const walletCanPay = useWalletCanPay({
    gasLimit,
    maxFeePerGas: advancedParams.maxFeePerGas,
  })

  const submitDisabled = !txThroughRole || isPending || disableSubmit || (needsRiskConfirmation && !isRiskConfirmed)

  return (
    <>
      <Divider className={commonCss.nestedDivider} sx={{ pt: 1 }} />

      <form onSubmit={handleSubmit}>
        {!permissionsError && (
          <>
            <Typography sx={{ mb: 2 }}>
              Your <Role>{role.roleKey}</Role> role allows you to execute this transaction without the confirmations of
              other owners.
            </Typography>

            <div className={commonCss.params}>
              <AdvancedParams
                willExecute
                params={advancedParams}
                recommendedGasLimit={gasLimit}
                onFormSubmit={setAdvancedParams}
                gasLimitError={gasLimitError}
              />
            </div>
          </>
        )}

        {permissionsError && (
          <Box mb={2}>
            <Typography sx={{ mb: 2 }}>
              You are a member of the <Role>{role.roleKey}</Role> role but it does not allow this transaction.
            </Typography>

            <ErrorMessage>{permissionsError}</ErrorMessage>
          </Box>
        )}

        <Typography variant="caption" display="flex" gap="2px" color="text.secondary" sx={{ mb: 2 }}>
          Powered by
          <img src="/images/transactions/zodiac-roles.svg" width={16} height={16} alt="Zodiac Roles" />
          <span className={css.zodiac}>Zodiac</span>
        </Typography>

        {multiSendImpossible && (
          <Box mt={1}>
            <ErrorMessage>
              The current configuration of the Zodiac Roles module does not allow executing multiple transactions in
              batch.
            </ErrorMessage>
          </Box>
        )}

        {!walletCanPay ? (
          <Box mt={1}>
            <ErrorMessage level="info">
              Your connected wallet doesn&apos;t have enough funds to execute this transaction.
            </ErrorMessage>
          </Box>
        ) : (
          gasLimitError && (
            <Box mt={1}>
              <ErrorMessage error={gasLimitError}>
                This transaction will most likely fail. To save gas costs, avoid creating this transaction.
              </ErrorMessage>
            </Box>
          )
        )}

        {submitError && (
          <Box mt={1}>
            <ErrorMessage error={submitError}>Error submitting the transaction. Please try again.</ErrorMessage>
          </Box>
        )}

        {isRejectedByUser && (
          <Box mt={1}>
            <WalletRejectionError />
          </Box>
        )}

        <Box mt={3}>
          <Divider className={commonCss.nestedDivider} />
        </Box>

        <CardActions>
          {/* Submit button, also available to non-owner role members */}
          <CheckWallet allowNonOwner checkNetwork={!submitDisabled}>
            {(isOk) => (
              <Button
                data-testid="execute-through-role-form-btn"
                variant="contained"
                type="submit"
                disabled={!isOk || submitDisabled}
                sx={{ minWidth: '112px' }}
              >
                {isPending ? <CircularProgress size={20} /> : 'Execute'}
              </Button>
            )}
          </CheckWallet>
        </CardActions>
      </form>
    </>
  )
}

const useTxSecurityContext = () => useContext(TxSecurityContext)

export default madProps(ExecuteThroughRoleForm, {
  txSecurity: useTxSecurityContext,
})

const PermissionsErrorMessage: Record<Status, string | null> = {
  [Status.Ok]: null,

  [Status.DelegateCallNotAllowed]: 'Role is not allowed to delegate call to target address',
  [Status.TargetAddressNotAllowed]: 'Role is not allowed to call target address',
  [Status.FunctionNotAllowed]: 'Role is not allowed to call this function on the target address',
  [Status.SendNotAllowed]: 'Role is not allowed to send to target address',
  [Status.OrViolation]: 'Condition violation: None of the Or branch conditions are met',
  [Status.NorViolation]: 'Condition violation: At least one Nor branch condition is met',
  [Status.ParameterNotAllowed]: 'Condition violation: Parameter value is not allowed',
  [Status.ParameterLessThanAllowed]: 'Condition violation: Parameter value is less than allowed',
  [Status.ParameterGreaterThanAllowed]: 'Condition violation: Parameter value is greater than allowed',
  [Status.ParameterNotAMatch]: 'Condition violation: Parameter value does not match',
  [Status.NotEveryArrayElementPasses]: 'Condition violation: Not every array element meets the criteria',
  [Status.NoArrayElementPasses]: 'Condition violation: None of the array elements meet the criteria',
  [Status.ParameterNotSubsetOfAllowed]: 'Condition violation: Parameter value is not a subset of allowed values',
  [Status.BitmaskOverflow]: 'Condition violation: Bitmask exceeded value length',
  [Status.BitmaskNotAllowed]: 'Condition violation: Bitmask does not allow the value',
  [Status.CustomConditionViolation]: 'Condition violation: Custom condition is not met',
  [Status.AllowanceExceeded]: 'Condition violation: Allowance is exceeded',
  [Status.CallAllowanceExceeded]: 'Condition violation: Call allowance is exceeded',
  [Status.EtherAllowanceExceeded]: 'Condition violation: Ether allowance is exceeded',
}
