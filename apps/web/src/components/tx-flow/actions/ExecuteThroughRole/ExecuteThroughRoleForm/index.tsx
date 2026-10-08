import useWalletCanPay from '@/hooks/useWalletCanPay'
import madProps from '@/utils/mad-props'
import { type ReactElement, type SyntheticEvent, useContext } from 'react'

import { trackError, Errors } from '@/services/exceptions'
import { useCurrentChain } from '@/hooks/useChains'
import { getTxOptions } from '@/utils/transactions'
import CheckWallet from '@/components/common/CheckWallet'

import type { SafeTransaction } from '@safe-global/types-kit'
import { TxModalContext } from '@/components/tx-flow'
import { SuccessScreenFlow } from '@/components/tx-flow/flows'
import { useSafeScope } from '@/components/tx-flow/safe-scope'
import AdvancedParams, { useAdvancedParams } from '../../../../tx/AdvancedParams'
import { asError } from '@safe-global/utils/services/exceptions/utils'
import { isWalletRejection } from '@/utils/wallets'

import { pollModuleTransactionId, useExecuteThroughRole, useGasLimit, useMetaTransactions, type Role } from './hooks'
import { decodeBytes32String } from 'ethers'
import useOnboard from '@/hooks/wallets/useOnboard'
import useWallet from '@/hooks/wallets/useWallet'
import useSafeInfo from '@/hooks/useSafeInfo'
import { assertOnboard, assertWallet } from '@/utils/helpers'
import { dispatchModuleTxExecution } from '@/services/tx/tx-sender'
import { Status } from 'zodiac-roles-deployments'
import { useSafeShield } from '@/features/safe-shield/SafeShieldContext'
import type { SlotComponentProps, SlotName } from '../../../slots'
import { TxFlowContext } from '../../../TxFlowProvider'
import type { SubmitCallback } from '../../../TxFlow'
import { ExecuteThroughRoleFormView } from '@views/components/tx-flow/actions/ExecuteThroughRole/ExecuteThroughRoleForm/ExecuteThroughRoleFormView'

const decodeRoleKey = (roleKey: string): string => {
  let humanReadableRoleKey = roleKey
  try {
    humanReadableRoleKey = decodeBytes32String(roleKey)
  } catch (e) {}

  return humanReadableRoleKey
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
  const scope = useSafeScope()
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

    const successScope = scope ? { chainId: scope.chainId, safeAddress: scope.safeAddress } : undefined

    // On success, forward to the success screen, initially without a txId
    setTxFlow(<SuccessScreenFlow txHash={txHash} scope={successScope} />, undefined, false)

    // Wait for module tx to be indexed
    const transactionService = currentChain?.transactionService
    if (!transactionService) {
      throw new Error('Transaction service not found')
    }
    const txId = await pollModuleTransactionId(chainId, safe.address.value, txHash)
    onSubmitSuccess?.({ txId, isExecuted: true })

    // Update the success screen so it shows a link to the transaction
    setTxFlow(<SuccessScreenFlow txId={txId} scope={successScope} />, undefined, false)
  }

  const walletCanPay = useWalletCanPay({
    gasLimit,
    maxFeePerGas: advancedParams.maxFeePerGas,
  })

  const submitDisabled =
    !txThroughRole || isSubmitLoading || disableSubmit || (needsRiskConfirmation && !isRiskConfirmed)

  return (
    <ExecuteThroughRoleFormView
      onSubmit={handleSubmit}
      roleKey={decodeRoleKey(role.roleKey)}
      permissionsError={permissionsError}
      advancedParams={
        <AdvancedParams
          willExecute
          params={advancedParams}
          recommendedGasLimit={gasLimit}
          onFormSubmit={setAdvancedParams}
          gasLimitError={gasLimitError}
        />
      }
      multiSendImpossible={multiSendImpossible}
      walletCanPay={walletCanPay}
      gasLimitError={gasLimitError}
      renderCheckWallet={(render) => (
        <CheckWallet allowNonOwner checkNetwork={!submitDisabled}>
          {render}
        </CheckWallet>
      )}
      slotId={slotId}
      onChange={onChange}
      options={options}
      submitDisabled={submitDisabled}
      isSubmitLoading={isSubmitLoading}
    />
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
