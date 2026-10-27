import { useContext, type ReactElement } from 'react'
import NextLink from 'next/link'
import { isAddress } from 'ethers'
import { FormProvider, useForm } from 'react-hook-form'
import { TxFlowContext, type TxFlowContextType } from '@/components/tx-flow/TxFlowProvider'
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
import GuardStatusBanner, {
  type GuardStatus,
} from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/GuardStatusBanner'
import {
  NESTED_SAFES_NOTICE_TITLE,
  getNestedSafesNoticeText,
} from '@safe-global/views/features/spaces/components/Policies/SafeAccountSelector/constants'
import { NEXT_LABEL } from '@safe-global/views/features/spaces/components/Policies/SpendingLimitFlow/constants'
import {
  NO_ELIGIBLE_SAFES_DESCRIPTION,
  NO_ELIGIBLE_SAFES_TITLE,
} from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/constants'
import { createRecipientAllowlistFormValues, type RecipientAllowlistFormValues } from '../types'
import AllowlistFields from './AllowlistFields'

const renderGuardAddress = (address: string) => <AccountIdentity address={address} showCopyButton />

// Only a Safe without a guard, or with the policy guard in both slots, can take the change as built
const isGuardReady = (guard?: GuardStatus): boolean => guard?.status === 'none' || guard?.status === 'known'

const hasEntries = (rows: Array<{ address: string }> = []) => rows.some((row) => isAddress(row.address))

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

  const { data, onNext } = useContext<TxFlowContextType<RecipientAllowlistFormValues>>(TxFlowContext)
  const formMethods = useForm<RecipientAllowlistFormValues>({
    defaultValues: data ?? createRecipientAllowlistFormValues(),
    mode: 'onChange',
  })
  const values = formMethods.watch()
  const canContinue =
    !!target &&
    isGuardReady(guard) &&
    hasEntries(values.tokens) &&
    hasEntries(values.recipients) &&
    Object.keys(formMethods.formState.errors).length === 0

  const isSettled = !isLoading && !isError
  const settingsHref = selectedSafe?.chain
    ? withSpaceIdInUrl(
        `${AppRoutes.settings.modules}?safe=${selectedSafe.chain.shortName}:${selectedSafe.address}`,
        spaceId,
      )
    : undefined

  return (
    <TxCard>
      <FormProvider {...formMethods}>
        <form
          onSubmit={formMethods.handleSubmit(onNext)}
          className="flex flex-col gap-5"
          data-testid="recipient-allowlist-create-step"
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

          {target && isGuardReady(guard) && <AllowlistFields />}

          <TxCardActions>
            <Button type="submit" size="submit" disabled={!canContinue} data-testid="next-btn">
              {NEXT_LABEL}
            </Button>
          </TxCardActions>
        </form>
      </FormProvider>
    </TxCard>
  )
}

export default CreateRecipientAllowlistPolicy
