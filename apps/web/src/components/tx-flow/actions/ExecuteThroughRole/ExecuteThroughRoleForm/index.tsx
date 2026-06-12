import useWalletCanPay from '@/hooks/useWalletCanPay'
import madProps from '@/utils/mad-props'
import { type ReactElement, type SyntheticEvent, useContext } from 'react'
import { Typography } from '@/components/ui/typography'
import { Separator } from '@/components/ui/separator'

import ErrorMessage from '@/components/tx/ErrorMessage'
import { trackError, Errors } from '@/services/exceptions'
import { useCurrentChain } from '@/hooks/useChains'
import { getTxOptions } from '@/utils/transactions'
import CheckWallet from '@/components/common/CheckWallet'

import type { SafeTransaction } from '@safe-global/types-kit'
import { TxModalContext } from '@/components/tx-flow'
import { SuccessScreenFlow } from '@/components/tx-flow/flows'
import AdvancedParams, { useAdvancedParams } from '../../../../tx/AdvancedParams'
import { asError } from '@safe-global/utils/services/exceptions/utils'
import { isWalletRejection } from '@/utils/wallets'

import css from './styles.module.css'
import commonCss from '@/components/tx-flow/common/styles.module.css'

import { pollModuleTransactionId, useExecuteThroughRole, useGasLimit, useMetaTransactions, type Role } from './hooks'
import { decodeBytes32String } from 'ethers'
import useOnboard from '@/hooks/wallets/useOnboard'
import useWallet from '@/hooks/wallets/useWallet'
import useSafeInfo from '@/hooks/useSafeInfo'
import { assertOnboard, assertWallet } from '@/utils/helpers'
import { dispatchModuleTxExecution } from '@/services/tx/tx-sender'
import { Status } from 'zodiac-roles-deployments'
import { useSafeShield } from '@/features/safe-shield/SafeShieldContext'
import SplitMenuButton from '@/components/common/SplitMenuButton'
import type { SlotComponentProps, SlotName } from '../../../slots'
import { TxFlowContext } from '../../../TxFlowProvider'
import type { SubmitCallback } from '../../../TxFlow'

const RoleChip = ({ children }: { children: string }) => {
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
  onSubmitSuccess,
  disableSubmit = false,
  options = [],
  onChange,
  slotId,
  txSecurity,
}: SlotComponentProps<SlotName.ComboSubmit> & {
  safeTx?: SafeTransaction
  role: Role
  disableSubmit?: boolean
  onSubmitSuccess?: SubmitCallback
  txSecurity: ReturnType<typeof useSafeShield>
}): ReactElement => {
  const currentChain = useCurrentChain()
  const onboard = useOnboard()
  const wallet = useWallet()
  const { safe } = useSafeInfo()

  const chainId = currentChain?.chainId || '1'

  const { setTxFlow } = useContext(TxModalContext)
  const { needsRiskConfirmation, isRiskConfirmed } = txSecurity
  const { isSubmitLoading, setIsSubmitLoading, setSubmitError, setIsRejectedByUser } = useContext(TxFlowContext)

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

    assertWallet(wallet)
    assertOnboard(onboard)

    setIsSubmitLoading(true)
    setSubmitError(undefined)
    setIsRejectedByUser(false)

    if (!txThroughRole) {
      throw new Error('Execution through role is not possible')
    }

    const txOptions = getTxOptions(advancedParams, currentChain)

    onSubmit?.()

    let txHash: string
    try {
      txHash = await dispatchModuleTxExecution(
        { ...txThroughRole, ...txOptions },
        wallet.provider,
        safe.chainId,
        safe.address.value,
      )
    } catch (_err) {
      const err = asError(_err)
      if (isWalletRejection(err)) {
        setIsRejectedByUser(true)
      } else {
        trackError(Errors._815, err)
        setSubmitError(err)
      }
      setIsSubmitLoading(false)
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
    onSubmitSuccess?.({ txId, isExecuted: true })

    // Update the success screen so it shows a link to the transaction
    setTxFlow(<SuccessScreenFlow txId={txId} />, undefined, false)
  }

  const walletCanPay = useWalletCanPay({
    gasLimit,
    maxFeePerGas: advancedParams.maxFeePerGas,
  })

  const submitDisabled =
    !txThroughRole || isSubmitLoading || disableSubmit || (needsRiskConfirmation && !isRiskConfirmed)

  return (
    <>
      <form onSubmit={handleSubmit}>
        {!permissionsError && (
          <>
            <Typography className="mb-4">
              Your <RoleChip>{role.roleKey}</RoleChip> role allows you to execute this transaction without the
              confirmations of other owners.
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
          <div className="mb-4">
            <Typography className="mb-4">
              You are a member of the <RoleChip>{role.roleKey}</RoleChip> role but it does not allow this transaction.
            </Typography>

            <ErrorMessage>{permissionsError}</ErrorMessage>
          </div>
        )}

        <Typography variant="paragraph-mini" className="mb-4 flex gap-[2px] text-muted-foreground">
          Powered by
          <img src="/images/transactions/zodiac-roles.svg" width={16} height={16} alt="Zodiac Roles" />
          <span className={css.zodiac}>Zodiac</span>
        </Typography>

        {multiSendImpossible && (
          <div className="mt-2">
            <ErrorMessage>
              The current configuration of the Zodiac Roles module does not allow executing multiple transactions in
              batch.
            </ErrorMessage>
          </div>
        )}

        {!walletCanPay ? (
          <div className="mt-2">
            <ErrorMessage level="info">
              Your connected wallet doesn&apos;t have enough funds to execute this transaction.
            </ErrorMessage>
          </div>
        ) : (
          gasLimitError && (
            <div className="mt-2">
              <ErrorMessage error={gasLimitError}>
                This transaction will most likely fail. To save gas costs, avoid creating this transaction.
              </ErrorMessage>
            </div>
          )
        )}

        <div className="pt-6">
          <Separator className={commonCss.nestedDivider} />
        </div>

        <div className="txCardActions">
          {/* Submit button, also available to non-owner role members */}
          <CheckWallet allowNonOwner checkNetwork={!submitDisabled}>
            {(isOk) => (
              <div className="w-full min-w-[112px] lg:w-auto">
                <SplitMenuButton
                  selected={slotId}
                  onChange={({ id }) => onChange?.(id)}
                  options={options}
                  disabled={!isOk || submitDisabled}
                  loading={isSubmitLoading}
                />
              </div>
            )}
          </CheckWallet>
        </div>
      </form>
    </>
  )
}

export default madProps(ExecuteThroughRoleForm, {
  txSecurity: useSafeShield,
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
