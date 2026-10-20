import type { ReactElement } from 'react'
import NextLink from 'next/link'
import { parseSafeScopeKey, useSafeScope, useSafeScopeControls } from '@safe-global/views/components/tx-flow/safe-scope'
import TxCard, { TxCardActions } from '@safe-global/views/components/tx-flow/common/TxCard'
import { Alert, AlertDescription, AlertSeverityIcon, AlertTitle } from '@safe-global/views/components/ui/alert'
import { Button } from '@safe-global/views/components/ui/button'
import { Link } from '@safe-global/views/components/ui/link'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { AppRoutes } from '@/config/routes'
import { useUrlSpaceId, withSpaceIdInUrl } from '@/hooks/useUrlSpaceId'
import SafeAccountSelector from '../../SafeAccountSelector'
import { findSafeAccount } from '../../SafeAccountSelector/utils'
import { AccountIdentity } from '../../components/AccountIdentity'
import { useRecipientAllowlistSafeAccounts } from '../hooks/useRecipientAllowlistSafeAccounts'
import { useGuardStatus } from '../hooks/useGuardStatus'
import GuardStatusBanner from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/GuardStatusBanner'
import {
  NESTED_SAFES_NOTICE_TITLE,
  getNestedSafesNoticeText,
} from '@safe-global/views/features/spaces/components/Policies/SafeAccountSelector/constants'
import { NEXT_LABEL } from '@safe-global/views/features/spaces/components/Policies/SpendingLimitFlow/constants'
import {
  NO_ELIGIBLE_SAFES_DESCRIPTION,
  NO_ELIGIBLE_SAFES_TITLE,
} from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/constants'

const renderGuardAddress = (address: string) => <AccountIdentity address={address} showCopyButton />

const CreateRecipientAllowlistPolicy = (): ReactElement => {
  const { accounts, isLoading, isError, refetch, hasWallet, hasSelectableAccount } = useRecipientAllowlistSafeAccounts()
  const { setScope } = useSafeScopeControls()
  const spaceId = useUrlSpaceId()
  const scopeKey = useSafeScope()?.scopeKey

  const selectedSafe = findSafeAccount(accounts, scopeKey)
  const target =
    selectedSafe && !selectedSafe.ineligibleReason
      ? { chainId: selectedSafe.chainId, safeAddress: selectedSafe.address }
      : undefined
  const { guard, retry } = useGuardStatus(target)

  const isSettled = !isLoading && !isError
  const settingsHref = selectedSafe?.chain
    ? withSpaceIdInUrl(
        `${AppRoutes.settings.modules}?safe=${selectedSafe.chain.shortName}:${selectedSafe.address}`,
        spaceId,
      )
    : undefined

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
          <Alert
            variant="warning"
            outlined={false}
            className="*:data-[slot=alert-description]:text-muted-foreground"
            data-testid="no-eligible-safes"
          >
            <AlertSeverityIcon variant="warning" />
            <AlertTitle>{NO_ELIGIBLE_SAFES_TITLE}</AlertTitle>
            <AlertDescription>{NO_ELIGIBLE_SAFES_DESCRIPTION}</AlertDescription>
          </Alert>
        )}

        {selectedSafe && guard && (
          <GuardStatusBanner
            guard={guard}
            safeName={selectedSafe.name || shortenAddress(selectedSafe.address)}
            settingsLink={settingsHref && <Link render={<NextLink href={settingsHref} />}>Go to Safe settings</Link>}
            renderAddress={renderGuardAddress}
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
