import { useCallback, useState, type ReactElement } from 'react'
import { SafeScopeProvider } from '@/components/tx-flow/safe-scope/SafeScopeProvider'
import { parseSafeScopeKey, useSafeScopeControls } from '@/components/tx-flow/safe-scope'
import TxLayoutBase from '@/components/tx-flow/common/TxLayoutBase'
import { useEligibleSafeAccounts } from '../SafeAccountSelector/hooks/useEligibleSafeAccounts'
import { CREATE_POLICY_TITLE } from './constants'
import { useProposerValidation } from './hooks/useProposerValidation'
import ProposerRoleForm from './ProposerRoleForm'
import ProposerRoleHeader from './ProposerRoleHeader'

const ProposerRoleFlowContent = (): ReactElement => {
  const [safeAccount, setSafeAccount] = useState<string>()
  const { setScope, clearScope } = useSafeScopeControls()
  const safeAccounts = useEligibleSafeAccounts()
  const validateProposer = useProposerValidation()

  const onSafeAccountChange = useCallback(
    (value: string) => {
      setSafeAccount(value)
      const target = parseSafeScopeKey(value)
      if (target) setScope(target.chainId, target.safeAddress)
      else clearScope()
    },
    [setScope, clearScope],
  )

  const onSubmit = useCallback(() => {}, [])

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
