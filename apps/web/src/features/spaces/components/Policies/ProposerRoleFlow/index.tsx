import { useCallback, useContext, useState, type ReactElement } from 'react'
import { TxModalContext } from '@/components/tx-flow'
import { SafeScopeProvider } from '@/components/tx-flow/safe-scope/SafeScopeProvider'
import { parseSafeScopeKey, useSafeScopeControls } from '@/components/tx-flow/safe-scope'
import ErrorMessage from '@/components/tx/ErrorMessage'
import { getProposerErrorText } from '@/features/proposers/utils/proposerErrors'
import { useParentSafeWalletNotice } from '../hooks/useParentSafeWalletNotice'
import { useEligibleSafeAccounts } from '../SafeAccountSelector/hooks/useEligibleSafeAccounts'
import { findSafeAccount } from '../SafeAccountSelector/utils'
import { formatContactLabel } from '@views/features/spaces/components/Policies/utils/policyLabel'
import { PARENT_SAFE_WALLET_COPY } from '@views/features/spaces/components/Policies/ProposerRoleFlow/constants'
import { useGrantProposer } from './hooks/useGrantProposer'
import { useProposerValidation } from './hooks/useProposerValidation'
import ProposerRoleForm, { type ProposerRoleFormValues } from './ProposerRoleForm'
import { ProposerRoleFlowView } from '@views/features/spaces/components/Policies/ProposerRoleFlow/ProposerRoleFlowView'

const ProposerRoleFlowContent = (): ReactElement => {
  const [safeAccount, setSafeAccount] = useState<string>()
  const { setScope, clearScope } = useSafeScopeControls()
  const safeAccounts = useEligibleSafeAccounts({ signersOnly: true })
  const validateProposer = useProposerValidation()

  const { setTxFlow } = useContext(TxModalContext)
  const { grantProposerRole, isSubmitting, error, blockedReason, reset } = useGrantProposer()

  const account = findSafeAccount(safeAccounts.accounts, safeAccount)
  const parentSafeWallet = useParentSafeWalletNotice(account, PARENT_SAFE_WALLET_COPY)

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
      const safeLabel = account && formatContactLabel(account.address, account.name)
      if (await grantProposerRole(values, safeLabel)) setTxFlow(undefined)
    },
    [grantProposerRole, setTxFlow, account],
  )

  const errorMessage = error ? (
    <ErrorMessage error={error}>{getProposerErrorText(error, 'Error adding proposer')}</ErrorMessage>
  ) : blockedReason ? (
    <ErrorMessage>{blockedReason}</ErrorMessage>
  ) : undefined

  return (
    <ProposerRoleFlowView>
      <ProposerRoleForm
        onSubmit={onSubmit}
        safeAccounts={safeAccounts}
        safeAccount={safeAccount}
        onSafeAccountChange={onSafeAccountChange}
        validateProposer={validateProposer}
        isSubmitting={isSubmitting}
        errorMessage={errorMessage}
        parentSafeWallet={parentSafeWallet}
      />
    </ProposerRoleFlowView>
  )
}

const ProposerRoleFlow = (): ReactElement => (
  <SafeScopeProvider>
    <ProposerRoleFlowContent />
  </SafeScopeProvider>
)

export default ProposerRoleFlow
