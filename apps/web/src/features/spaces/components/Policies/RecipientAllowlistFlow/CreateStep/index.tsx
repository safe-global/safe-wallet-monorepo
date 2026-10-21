import type { ReactElement } from 'react'
import { parseSafeScopeKey, useSafeScope, useSafeScopeControls } from '@safe-global/views/components/tx-flow/safe-scope'
import TxCard, { TxCardActions } from '@safe-global/views/components/tx-flow/common/TxCard'
import { Button } from '@safe-global/views/components/ui/button'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import SafeAccountSelector from '../../SafeAccountSelector'
import { findSafeAccount } from '../../SafeAccountSelector/utils'
import { useRecipientAllowlistSafeAccounts } from '../hooks/useRecipientAllowlistSafeAccounts'
import { useGuardStatus } from '../hooks/useGuardStatus'
import GuardStatusBanner, {
  type GuardStatus,
} from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/GuardStatusBanner'
import AllowlistAlert from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/AllowlistAlert'
import {
  NESTED_SAFES_NOTICE_TITLE,
  getNestedSafesNoticeText,
} from '@safe-global/views/features/spaces/components/Policies/SafeAccountSelector/constants'
import { NEXT_LABEL } from '@safe-global/views/features/spaces/components/Policies/SpendingLimitFlow/constants'
import {
  NO_ELIGIBLE_SAFES_DESCRIPTION,
  NO_ELIGIBLE_SAFES_TITLE,
} from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/constants'

/** The guard states an allowlist can be set up on without a warning, so they get no banner. */
const SILENT_GUARD_STATES: GuardStatus['status'][] = ['none', 'known']

const CreateRecipientAllowlistPolicy = (): ReactElement => {
  const { accounts, isLoading, isError, refetch, hasWallet, hasSelectableAccount } = useRecipientAllowlistSafeAccounts()
  const { setScope } = useSafeScopeControls()
  const scopeKey = useSafeScope()?.scopeKey

  const selectedSafe = findSafeAccount(accounts, scopeKey)
  const target =
    selectedSafe && !selectedSafe.ineligibleReason
      ? { chainId: selectedSafe.chainId, safeAddress: selectedSafe.address }
      : undefined
  const { guard, retry } = useGuardStatus(target)

  const isSettled = !isLoading && !isError

  return (
    <TxCard>
      <div className="flex flex-col gap-5" data-testid="recipient-allowlist-create-step">
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
          <AllowlistAlert
            tone="warning"
            title={NO_ELIGIBLE_SAFES_TITLE}
            description={NO_ELIGIBLE_SAFES_DESCRIPTION}
            data-testid="no-eligible-safes"
          />
        )}

        {selectedSafe && guard && !SILENT_GUARD_STATES.includes(guard.status) && (
          <GuardStatusBanner
            guard={guard}
            safeName={selectedSafe.name || shortenAddress(selectedSafe.address)}
            onRetry={retry}
          />
        )}

        <TxCardActions>
          <Button type="button" size="submit" disabled data-testid="next-btn">
            {NEXT_LABEL}
          </Button>
        </TxCardActions>
      </div>
    </TxCard>
  )
}

export default CreateRecipientAllowlistPolicy
