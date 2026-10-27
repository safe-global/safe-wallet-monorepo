import { useContext, useMemo, useState, type ReactElement } from 'react'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { useSafeScope } from '@safe-global/views/components/tx-flow/safe-scope'
import TxCard, { TxCardActions } from '@safe-global/views/components/tx-flow/common/TxCard'
import StatusAlert from '@safe-global/views/components/common/StatusAlert'
import { Button } from '@safe-global/views/components/ui/button'
import { Checkbox } from '@safe-global/views/components/ui/checkbox'
import { Label } from '@safe-global/views/components/ui/label'
import { Typography } from '@safe-global/views/components/ui/typography'
import SpendingLimitImpactRow from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/SpendingLimitImpactRow'
import {
  getImpactAfterText,
  getImpactTodayText,
  getRestrictedSpendingLimitsTitle,
  getSpendingLimitsGroupTitle,
  getTokenInAllowlistText,
  getTokenNotInAllowlistText,
  RESTRICTED_SPENDING_LIMITS_DESCRIPTION,
  RESTRICTION_ACKNOWLEDGEMENT_LABEL,
} from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/constants'
import type { RecipientAllowlistFlowData } from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/types'
import { formatAllowanceAmount } from '@safe-global/views/features/spaces/components/Policies/SpendingLimitDrawer/format'
import { NEXT_LABEL } from '@safe-global/views/features/spaces/components/Policies/SpendingLimitFlow/constants'
import { TxFlowContext, type TxFlowContextType } from '@/components/tx-flow/TxFlowProvider'
import { useMergedAddressBooks } from '@/hooks/useAllAddressBooks'
import { AccountIdentity } from '../../components/AccountIdentity'
import { findSafeAccount } from '../../SafeAccountSelector/utils'
import { useRecipientAllowlistSafeAccounts } from '../hooks/useRecipientAllowlistSafeAccounts'
import { useSpendingLimitImpacts } from '../hooks/useSpendingLimitImpacts'

const ACKNOWLEDGEMENT_ID = 'recipient-allowlist-restriction-acknowledgement'

/** Shown only when the allowlist restricts a spending limit on the picked Safe: Next waits for the acknowledgement. */
const ExistingPoliciesStep = (): ReactElement => {
  const { data, onNext } = useContext<TxFlowContextType<RecipientAllowlistFlowData>>(TxFlowContext)
  const rules = useMemo(() => data?.rules ?? [], [data?.rules])
  const impacts = useSpendingLimitImpacts(rules)
  const scope = useSafeScope()
  const chainId = scope?.chainId
  const addressBook = useMergedAddressBooks(chainId)
  const { accounts } = useRecipientAllowlistSafeAccounts()
  const selectedSafe = findSafeAccount(accounts, scope?.scopeKey)
  const [acknowledged, setAcknowledged] = useState(false)

  const restrictedCount = impacts.filter(({ restricted }) => restricted).length
  const safeName = selectedSafe?.name || (scope?.safeAddress ? shortenAddress(scope.safeAddress) : '')

  return (
    <TxCard>
      <div className="flex flex-col gap-5" data-testid="recipient-allowlist-existing-policies-step">
        <StatusAlert
          tone="warning"
          title={getRestrictedSpendingLimitsTitle(restrictedCount)}
          description={RESTRICTED_SPENDING_LIMITS_DESCRIPTION}
        />

        <div className="flex flex-col gap-3 rounded-xl bg-muted p-4">
          <Typography variant="paragraph-small-medium">{getSpendingLimitsGroupTitle(safeName)}</Typography>
          {impacts.map(({ spender, allowance, restricted, recipients }) => {
            const amount = formatAllowanceAmount(allowance)
            const { symbol } = allowance.token

            return (
              <SpendingLimitImpactRow
                key={`${spender}-${allowance.token.address}`}
                spender={
                  <AccountIdentity
                    address={spender}
                    name={chainId ? addressBook.get(spender, chainId)?.name : undefined}
                  />
                }
                description={`${amount} · ${restricted ? getTokenInAllowlistText(symbol) : getTokenNotInAllowlistText(symbol)}`}
                restriction={
                  restricted
                    ? {
                        today: getImpactTodayText(symbol, amount),
                        after: getImpactAfterText(symbol, recipients.length, amount),
                      }
                    : undefined
                }
              />
            )
          })}
        </div>

        <div className="flex items-start gap-3">
          <Checkbox
            id={ACKNOWLEDGEMENT_ID}
            checked={acknowledged}
            onCheckedChange={(checked) => setAcknowledged(checked === true)}
          />
          <Label htmlFor={ACKNOWLEDGEMENT_ID}>{RESTRICTION_ACKNOWLEDGEMENT_LABEL}</Label>
        </div>

        <TxCardActions>
          <Button
            type="button"
            size="submit"
            disabled={!acknowledged}
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
