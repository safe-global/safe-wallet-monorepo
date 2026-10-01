import { useCallback, useContext, useState, type ReactElement } from 'react'
import { getSafeDisplayInfo } from '@/components/common/AccountRow'
import { TxModalContext } from '@/components/tx-flow'
import { SafeScopeProvider } from '@/components/tx-flow/safe-scope/SafeScopeProvider'
import { parseSafeScopeKey, useSafeScopeControls } from '@/components/tx-flow/safe-scope'
import TxLayoutBase from '@/components/tx-flow/common/TxLayoutBase'
import ErrorMessage from '@/components/tx/ErrorMessage'
import { AppRoutes } from '@/config/routes'
import { getProposerErrorText } from '@/features/proposers/utils/proposerErrors'
import { useAddressBookItem } from '@/hooks/useAllAddressBooks'
import { useUrlSpaceId, withSpaceId } from '@/hooks/useUrlSpaceId'
import { useEligibleSafeAccounts } from '../SafeAccountSelector/hooks/useEligibleSafeAccounts'
import { findSafeAccount } from '../SafeAccountSelector/utils'
import { formatContactLabel } from '../utils/policyLabel'
import { CREATE_POLICY_TITLE } from './constants'
import { useGrantProposer } from './hooks/useGrantProposer'
import { useParentSafeWallet } from './hooks/useParentSafeWallet'
import { useProposerValidation } from './hooks/useProposerValidation'
import ProposerRoleForm, { type ProposerRoleFormValues } from './ProposerRoleForm'
import ProposerRoleHeader from './ProposerRoleHeader'

const ProposerRoleFlowContent = (): ReactElement => {
  const [safeAccount, setSafeAccount] = useState<string>()
  const { setScope, clearScope } = useSafeScopeControls()
  const safeAccounts = useEligibleSafeAccounts({ signersOnly: true })
  const validateProposer = useProposerValidation()

  const { setTxFlow } = useContext(TxModalContext)
  const { grantProposerRole, isSubmitting, error, blockedReason, reset } = useGrantProposer()
  const spaceId = useUrlSpaceId()

  const closeWithoutPrompt = useCallback(() => setTxFlow(undefined, undefined, false), [setTxFlow])

  const account = findSafeAccount(safeAccounts.accounts, safeAccount)
  const { parentSafeAddress, isChecking } = useParentSafeWallet(account?.chainId)
  const parentContact = useAddressBookItem(parentSafeAddress ?? '', account?.chainId)
  const parentSafeWallet =
    account && parentSafeAddress
      ? {
          safeName: getSafeDisplayInfo(account.name ?? '', account.address).displayName,
          parentSafeName: getSafeDisplayInfo(parentContact?.name ?? '', parentSafeAddress).displayName,
          settingsHref: account.chain
            ? {
                pathname: AppRoutes.settings.setup,
                query: withSpaceId({ safe: `${account.chain.shortName}:${account.address}` }, spaceId),
              }
            : undefined,
          onNavigate: closeWithoutPrompt,
        }
      : undefined

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
          parentSafeWallet={parentSafeWallet}
          isCheckingWallet={isChecking}
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
