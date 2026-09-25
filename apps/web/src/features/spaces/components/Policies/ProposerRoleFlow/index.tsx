import { useCallback, useContext, useState, type ReactElement } from 'react'
import { TxModalContext } from '@/components/tx-flow'
import { SafeScopeProvider } from '@/components/tx-flow/safe-scope/SafeScopeProvider'
import { parseSafeScopeKey, useSafeScopeControls } from '@/components/tx-flow/safe-scope'
import TxLayoutBase from '@/components/tx-flow/common/TxLayoutBase'
import ErrorMessage from '@/components/tx/ErrorMessage'
import { getProposerErrorText } from '@/features/proposers/utils/proposerErrors'
import { useEligibleSafeAccounts } from '../SafeAccountSelector/hooks/useEligibleSafeAccounts'
import { CREATE_POLICY_TITLE } from './constants'
import { useGrantProposer } from './hooks/useGrantProposer'
import { useProposerValidation } from './hooks/useProposerValidation'
import ProposerRoleForm, { type ProposerRoleFormValues } from './ProposerRoleForm'
import ProposerRoleHeader from './ProposerRoleHeader'

const ProposerRoleFlowContent = (): ReactElement => {
  const [safeAccount, setSafeAccount] = useState<string>()
  const { setScope, clearScope } = useSafeScopeControls()
  const safeAccounts = useEligibleSafeAccounts()
  const validateProposer = useProposerValidation()

  const { setTxFlow } = useContext(TxModalContext)
  const { grantProposerRole, isSubmitting, error, blockedReason, reset } = useGrantProposer()

  const onSafeAccountChange = useCallback(
    (value: string) => {
      reset()
      setSafeAccount(value)
      const target = parseSafeScopeKey(value)
      if (target) setScope(target.chainId, target.safeAddress)
      else clearScope()
    },
    [reset, setScope, clearScope],
  )

  const onSubmit = useCallback(
    async (values: ProposerRoleFormValues) => {
      if (await grantProposerRole(values)) setTxFlow(undefined)
    },
    [grantProposerRole, setTxFlow],
  )

  const errorMessage = error ? (
    <ErrorMessage error={error}>{getProposerErrorText(error, 'Error adding proposer')}</ErrorMessage>
  ) : blockedReason ? (
    <ErrorMessage>{blockedReason}</ErrorMessage>
  ) : undefined

  return (
    <div className="min-[900px]:-mt-9">
      <TxLayoutBase
        title={<span className="block max-[899.95px]:px-4">{CREATE_POLICY_TITLE}</span>}
        subtitle={<ProposerRoleHeader />}
        step={0}
        stepCount={1}
        progress={100}
        hideStatusRail
        hideSafeShield
        hideProgress
        hideNonce
      >
        <ProposerRoleForm
          onSubmit={onSubmit}
          safeAccounts={safeAccounts}
          safeAccount={safeAccount}
          onSafeAccountChange={onSafeAccountChange}
          validateProposer={validateProposer}
          isSubmitting={isSubmitting}
          errorMessage={errorMessage}
        />
      </TxLayoutBase>
    </div>
  )
}

const ProposerRoleFlow = (): ReactElement => (
  <SafeScopeProvider>
    <ProposerRoleFlowContent />
  </SafeScopeProvider>
)

export default ProposerRoleFlow
