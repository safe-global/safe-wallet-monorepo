import { useCallback, useContext, useState, type ReactElement } from 'react'
import { TxModalContext } from '@/components/tx-flow'
import { SafeScopeProvider } from '@/components/tx-flow/safe-scope/SafeScopeProvider'
import { parseSafeScopeKey, useSafeScopeControls } from '@/components/tx-flow/safe-scope'
import TxLayoutBase from '@/components/tx-flow/common/TxLayoutBase'
import ErrorMessage from '@/components/tx/ErrorMessage'
import DialogActions from '@/components/common/DialogActions'
import ModalDialog from '@/components/common/ModalDialog'
import { Typography } from '@/components/ui/typography'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { getProposerErrorText } from '@/features/proposers/utils/proposerErrors'
import useGetAddressBookRequests from '../../../hooks/useGetAddressBookRequests'
import { useIsAdmin } from '../../../hooks/useSpaceMembers'
import { useEligibleSafeAccounts } from '../SafeAccountSelector/hooks/useEligibleSafeAccounts'
import { CREATE_POLICY_TITLE, PENDING_REQUEST_DESCRIPTION, PENDING_REQUEST_TITLE } from './constants'
import { useGrantProposer } from './hooks/useGrantProposer'
import { useProposerValidation } from './hooks/useProposerValidation'
import ProposerRoleForm, { type ProposerRoleFormValues } from './ProposerRoleForm'
import ProposerRoleHeader from './ProposerRoleHeader'

const ProposerRoleFlowContent = (): ReactElement => {
  const [safeAccount, setSafeAccount] = useState<string>()
  const { setScope, clearScope } = useSafeScopeControls()
  const safeAccounts = useEligibleSafeAccounts({ signersOnly: true })
  const validateProposer = useProposerValidation()
  const isAdmin = useIsAdmin()
  const pendingRequests = useGetAddressBookRequests()
  const [showPendingNotice, setShowPendingNotice] = useState(false)

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
      if (!(await grantProposerRole(values))) return

      const hasPendingRequest =
        !isAdmin &&
        !!values.name.trim() &&
        pendingRequests.some((request) => sameAddress(request.address, values.proposer))
      if (hasPendingRequest) setShowPendingNotice(true)
      else setTxFlow(undefined)
    },
    [grantProposerRole, isAdmin, pendingRequests, setTxFlow],
  )

  const closePendingNotice = useCallback(() => {
    setShowPendingNotice(false)
    setTxFlow(undefined)
  }, [setTxFlow])

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

      <ModalDialog
        open={showPendingNotice}
        onClose={closePendingNotice}
        dialogTitle={PENDING_REQUEST_TITLE}
        hideChainIndicator
      >
        <div className="px-6 py-4">
          <Typography variant="paragraph-small" color="muted">
            {PENDING_REQUEST_DESCRIPTION}
          </Typography>
        </div>

        <DialogActions
          className="px-6 pt-0 pb-6"
          confirmLabel="Got it"
          onConfirm={closePendingNotice}
          confirmTestId="close-pending-request-btn"
        />
      </ModalDialog>
    </div>
  )
}

const ProposerRoleFlow = (): ReactElement => (
  <SafeScopeProvider>
    <ProposerRoleFlowContent />
  </SafeScopeProvider>
)

export default ProposerRoleFlow
