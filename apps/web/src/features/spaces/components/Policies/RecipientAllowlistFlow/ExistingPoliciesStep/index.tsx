import { useContext, useMemo, useState, type ReactElement } from 'react'
import { useSafeScope } from '@safe-global/views/components/tx-flow/safe-scope'
import TxCard, { TxCardActions } from '@safe-global/views/components/tx-flow/common/TxCard'
import { Button } from '@safe-global/views/components/ui/button'
import ExistingPoliciesContent, {
  type ExistingPoliciesContentProps,
} from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/ExistingPoliciesContent'
import {
  getBlockedSpendingLimitDescription,
  getBlockedSpendingLimitsDescription,
  getBlockedSpendingLimitsTitle,
  getRestrictedSpendingLimitsTitle,
  getSpendingLimitsLoadErrorTitle,
  getTokenInAllowlistText,
  getTokenNotInAllowlistText,
  NO_SPENDING_LIMITS_TITLE,
  RESTRICTED_SPENDING_LIMITS_DESCRIPTION,
  RETRY_LABEL,
  SPENDING_LIMITS_LOAD_ERROR_DESCRIPTION,
  SPENDING_LIMITS_LOADING_TITLE,
} from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/constants'
import type { RecipientAllowlistFlowData } from '../types'
import { formatAllowanceAmount } from '@safe-global/views/features/spaces/components/Policies/SpendingLimitDrawer/format'
import { formatAllowance } from '@safe-global/views/features/spaces/components/Policies/utils/policyLabel'
import { NEXT_LABEL } from '@safe-global/views/features/spaces/components/Policies/SpendingLimitFlow/constants'
import { useIsEditMode } from '@safe-global/views/features/spaces/components/Policies/SpendingLimitFlow/EditFlow/EditModeContext'
import { TxFlowContext, type TxFlowContextType } from '@/components/tx-flow/TxFlowProvider'
import { useSafeNameResolver } from '@/hooks/useAllAddressBooks'
import { AccountIdentity } from '../../components/AccountIdentity'
import { findSafeAccount } from '../../SafeAccountSelector/utils'
import { spenderDisplayName } from '../../SpendingLimitFlow/Summary/describePolicy'
import { useRecipientAllowlistSafeAccounts } from '../hooks/useRecipientAllowlistSafeAccounts'
import { useSpendingLimitImpacts } from '../hooks/useSpendingLimitImpacts'

/**
 * Shown when the picked Safe has an active spending limit, which the allowlist restricts or blocks, or when they
 * couldn't be loaded: lists them all, Next waits for them to load and for the acknowledgement.
 */
const ExistingPoliciesStep = (): ReactElement => {
  const { data, onNext } = useContext<TxFlowContextType<RecipientAllowlistFlowData>>(TxFlowContext)
  const rules = useMemo(() => data?.rules ?? [], [data?.rules])
  const { impacts, isLoading, isError, refetch } = useSpendingLimitImpacts(rules)
  const scope = useSafeScope()
  const chainId = scope?.chainId
  const resolveName = useSafeNameResolver()
  const { accounts } = useRecipientAllowlistSafeAccounts()
  const selectedSafe = findSafeAccount(accounts, scope?.scopeKey)
  const [acknowledged, setAcknowledged] = useState(false)
  const isEditMode = useIsEditMode()

  const safeName = scope?.safeAddress
    ? spenderDisplayName({ address: scope.safeAddress, name: selectedSafe?.name })
    : ''
  const contactName = (address: string) => resolveName(address, chainId) || undefined
  const rows = impacts.map(({ spender, allowance, impact }) => ({
    key: `${spender}-${allowance.token.address}`,
    spender: <AccountIdentity address={spender} name={contactName(spender)} />,
    description: `${formatAllowanceAmount(allowance)} · ${impact === 'restricted' ? getTokenInAllowlistText(allowance.token.symbol) : getTokenNotInAllowlistText(allowance.token.symbol)}`,
    impact,
  }))
  const blocked = impacts.filter(({ impact }) => impact === 'blocked')
  const [onlyBlocked] = blocked

  const getBanner = (): ExistingPoliciesContentProps['banner'] => {
    if (isLoading) return { tone: 'loading', title: SPENDING_LIMITS_LOADING_TITLE }
    if (isError) {
      return {
        tone: 'error',
        title: getSpendingLimitsLoadErrorTitle(safeName),
        description: SPENDING_LIMITS_LOAD_ERROR_DESCRIPTION,
        action: (
          <Button type="button" variant="outline" size="sm" onClick={refetch}>
            {RETRY_LABEL}
          </Button>
        ),
      }
    }
    if (impacts.length === 0) return { tone: 'info', title: NO_SPENDING_LIMITS_TITLE }
    if (blocked.length === 0) {
      return {
        tone: 'info',
        title: getRestrictedSpendingLimitsTitle(impacts.length),
        description: RESTRICTED_SPENDING_LIMITS_DESCRIPTION,
      }
    }

    return {
      tone: 'warning',
      title: getBlockedSpendingLimitsTitle(blocked.length),
      description:
        blocked.length === 1
          ? getBlockedSpendingLimitDescription(
              spenderDisplayName({ address: onlyBlocked.spender, name: contactName(onlyBlocked.spender) }),
              formatAllowance(onlyBlocked.allowance),
              onlyBlocked.allowance.token.symbol,
              isEditMode,
            )
          : getBlockedSpendingLimitsDescription(isEditMode),
    }
  }

  return (
    <TxCard>
      <div className="flex flex-col gap-5" data-testid="recipient-allowlist-existing-policies-step">
        <ExistingPoliciesContent
          safeName={safeName}
          banner={getBanner()}
          rows={isLoading || isError ? [] : rows}
          acknowledged={acknowledged}
          onAcknowledgedChange={setAcknowledged}
        />

        <TxCardActions>
          <Button
            type="button"
            size="submit"
            disabled={!acknowledged || isLoading || isError}
            onClick={() => onNext(data)}
            data-testid="next-btn"
          >
            {NEXT_LABEL}
          </Button>
        </TxCardActions>
      </div>
    </TxCard>
  )
}

export default ExistingPoliciesStep
