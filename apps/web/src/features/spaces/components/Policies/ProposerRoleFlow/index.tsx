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
  const { accounts, isLoading, isError, hasWallet, refetch } = useEligibleSafeAccounts()
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
    <TxLayoutBase
      title={CREATE_POLICY_TITLE}
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
        accounts={accounts}
        safeAccount={safeAccount}
        onSafeAccountChange={onSafeAccountChange}
        validateProposer={validateProposer}
        accountsLoading={isLoading}
        accountsError={isError}
        onAccountsRetry={refetch}
        hasWallet={hasWallet}
      />
    </TxLayoutBase>
  )
}

const ProposerRoleFlow = (): ReactElement => (
  <SafeScopeProvider>
    <ProposerRoleFlowContent />
  </SafeScopeProvider>
)

export default ProposerRoleFlow
