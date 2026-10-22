import { useContext, useState, type ReactElement } from 'react'
import { parseSafeScopeKey, useSafeScope, useSafeScopeControls } from '@safe-global/views/components/tx-flow/safe-scope'
import { TxFlowContext, type TxFlowContextType } from '@/components/tx-flow/TxFlowProvider'
import { useSafeShieldForAddressPoisoning } from '@/features/safe-shield/SafeShieldContext'
import TxCard, { TxCardActions } from '@safe-global/views/components/tx-flow/common/TxCard'
import { Button } from '@safe-global/views/components/ui/button'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import SafeAccountSelector from '../../SafeAccountSelector'
import { chainLabel, findSafeAccount } from '../../SafeAccountSelector/utils'
import { useRecipientAllowlistSafeAccounts } from '../hooks/useRecipientAllowlistSafeAccounts'
import { useGuardStatus } from '../hooks/useGuardStatus'
import useHeldTokenAddresses from '../hooks/useHeldTokenAddresses'
import RecipientAllowlistForm, { type CalloutSection } from './RecipientAllowlistForm'
import {
  createDefaultAllowlistValues,
  type RecipientAllowlistFlowData,
  type RecipientAllowlistFormValues,
} from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/types'
import {
  buildAllowlistRules,
  isAllowlistComplete,
} from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/utils/allowlistForm'
import GuardStatusBanner, {
  type GuardStatus,
} from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/GuardStatusBanner'
import StatusAlert from '@safe-global/views/components/common/StatusAlert'
import {
  NESTED_SAFES_NOTICE_TITLE,
  getNestedSafesNoticeText,
} from '@safe-global/views/features/spaces/components/Policies/SafeAccountSelector/constants'
import { NEXT_LABEL } from '@safe-global/views/features/spaces/components/Policies/SpendingLimitFlow/constants'
import {
  getAllowlistAccountLabel,
  NO_ELIGIBLE_SAFES_DESCRIPTION,
  NO_ELIGIBLE_SAFES_TITLE,
} from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/constants'

/** The guard states an allowlist can be set up on. */
const READY_GUARD_STATES: GuardStatus['status'][] = ['none', 'known', 'partial']

export type CreateRecipientAllowlistPolicyProps = {
  dismissedCallouts: Record<CalloutSection, boolean>
  onDismissCallout: (section: CalloutSection) => void
}

const CreateRecipientAllowlistPolicy = ({
  dismissedCallouts,
  onDismissCallout,
}: CreateRecipientAllowlistPolicyProps): ReactElement => {
  const { data, onNext } = useContext<TxFlowContextType<RecipientAllowlistFlowData>>(TxFlowContext)
  const [values, setValues] = useState<RecipientAllowlistFormValues>(() => {
    const { excludedTokens, addedTokens, recipients } = data ?? createDefaultAllowlistValues()
    return { excludedTokens, addedTokens, recipients }
  })
  const { accounts, isLoading, isError, refetch, hasWallet, hasSelectableAccount } = useRecipientAllowlistSafeAccounts()
  const { setScope } = useSafeScopeControls()
  const scopeKey = useSafeScope()?.scopeKey

  const selectedSafe = findSafeAccount(accounts, scopeKey)
  const target =
    selectedSafe && !selectedSafe.ineligibleReason
      ? { chainId: selectedSafe.chainId, safeAddress: selectedSafe.address }
      : undefined
  const { guard, retry } = useGuardStatus(target)

  const heldTokens = useHeldTokenAddresses()

  useSafeShieldForAddressPoisoning(values.recipients.map((recipient) => recipient.address))

  // Reset during render, not in an effect, so the remounted recipients section never sees the old Safe's values.
  const [trackedScopeKey, setTrackedScopeKey] = useState(scopeKey)
  if (trackedScopeKey !== scopeKey) {
    setTrackedScopeKey(scopeKey)
    setValues(createDefaultAllowlistValues())
  }

  const canContinue = guard !== undefined && READY_GUARD_STATES.includes(guard.status)
  const canGoNext =
    canContinue && !heldTokens.isLoading && !heldTokens.isError && isAllowlistComplete(heldTokens.addresses, values)

  const isSettled = !isLoading && !isError
  const safeName = selectedSafe && (selectedSafe.name || shortenAddress(selectedSafe.address))

  return (
    <TxCard>
      <div className="flex flex-col gap-5" data-testid="recipient-allowlist-create-step">
        <RecipientAllowlistForm
          values={values}
          onChange={setValues}
          heldTokens={heldTokens}
          account={
            selectedSafe && safeName && target
              ? {
                  chainId: selectedSafe.chainId,
                  address: selectedSafe.address,
                  label: getAllowlistAccountLabel(safeName, chainLabel(selectedSafe)),
                }
              : undefined
          }
          showSections={!selectedSafe || canContinue}
          dismissedCallouts={dismissedCallouts}
          onDismissCallout={onDismissCallout}
        >
          <SafeAccountSelector
            accounts={accounts}
            value={scopeKey}
            onChange={(id) => {
              const next = parseSafeScopeKey(id)
              if (next) setScope(next.chainId, next.safeAddress)
            }}
            isLoading={isLoading}
            isError={isError}
            onRetry={refetch}
            hasWallet={hasWallet}
            notice={{
              title: NESTED_SAFES_NOTICE_TITLE,
              description: getNestedSafesNoticeText('recipient allowlists'),
            }}
            id="recipient-allowlist-safe-account"
          />

          {isSettled && hasWallet && !hasSelectableAccount && (
            <StatusAlert
              tone="warning"
              title={NO_ELIGIBLE_SAFES_TITLE}
              description={NO_ELIGIBLE_SAFES_DESCRIPTION}
              data-testid="no-eligible-safes"
            />
          )}

          {safeName && guard && <GuardStatusBanner guard={guard} safeName={safeName} onRetry={retry} />}
        </RecipientAllowlistForm>

        <TxCardActions>
          <Button
            type="button"
            size="submit"
            disabled={!canGoNext}
            onClick={() => onNext({ ...values, rules: buildAllowlistRules(heldTokens.addresses, values) })}
            data-testid="next-btn"
          >
            {NEXT_LABEL}
          </Button>
        </TxCardActions>
      </div>
    </TxCard>
  )
}

export default CreateRecipientAllowlistPolicy
