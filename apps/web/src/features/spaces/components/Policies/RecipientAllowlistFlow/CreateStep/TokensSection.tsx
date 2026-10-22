import { useMemo, useState, type ReactElement } from 'react'
import { Plus } from 'lucide-react'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { Button } from '@safe-global/views/components/ui/button'
import { Skeleton } from '@safe-global/views/components/ui/skeleton'
import TokenIcon from '@/components/common/TokenIcon'
import {
  AllowlistEmptyItem,
  AllowlistSection,
} from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/AllowlistSection'
import DismissibleCallout from '@safe-global/views/components/common/DismissibleCallout'
import StatusAlert from '@safe-global/views/components/common/StatusAlert'
import SelectableChip from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/SelectableChip'
import {
  POPULAR_LOAD_ERROR_TEXT,
  TOKEN_ICON_SIZE,
} from '@safe-global/views/features/spaces/components/Policies/SpendingLimitFlow/TokenSelector/constants'
import { getFormTokenAddresses } from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/utils/allowlistForm'
import type { RecipientAllowlistFormValues } from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/types'
import {
  ADD_TOKEN_LABEL,
  DESELECT_ALL_LABEL,
  SELECT_ALL_LABEL,
  TOKENS_CALLOUT_DESCRIPTION,
  TOKENS_CALLOUT_TITLE,
  TOKENS_EMPTY_TEXT,
  TOKENS_LOAD_ERROR_TEXT,
  TOKENS_NO_ACCOUNT_DESCRIPTION,
  TOKENS_SECTION_TITLE,
} from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/constants'
import { findTokenOption } from '../../SpendingLimitFlow/utils/tokenOptions'
import type { HeldTokenAddresses } from '../hooks/useHeldTokenAddresses'
import TokenDraftRow from './TokenDraftRow'

const SKELETON_CHIP_COUNT = 4
const RETRY_LABEL = 'Retry'

type TokensSectionProps = {
  values: RecipientAllowlistFormValues
  onChange: (next: RecipientAllowlistFormValues) => void
  heldTokens: HeldTokenAddresses
  hasAccount: boolean
  isCalloutDismissed: boolean
  onDismissCallout: () => void
}

const LoadErrorAlert = ({
  message,
  onRetry,
  'data-testid': testId,
}: {
  message: string
  onRetry: () => void
  'data-testid': string
}): ReactElement => (
  <StatusAlert
    tone="error"
    description={message}
    action={
      <Button type="button" variant="outline" size="sm" onClick={onRetry}>
        {RETRY_LABEL}
      </Button>
    }
    data-testid={testId}
  />
)

const TokensSection = ({
  values,
  onChange,
  heldTokens,
  hasAccount,
  isCalloutDismissed,
  onDismissCallout,
}: TokensSectionProps): ReactElement => {
  const {
    addresses,
    options,
    isLoading,
    isError,
    refetch,
    isPopularLoading,
    isPopularError,
    refetchPopular,
    identityKey,
  } = heldTokens
  // Keyed to the account it was opened for, so switching accounts closes the row
  const [addingFor, setAddingFor] = useState<string>()
  const isAdding = addingFor !== undefined && addingFor === identityKey
  const closeAdding = () => setAddingFor(undefined)
  const hasLoadError = isError && addresses.length === 0
  const showsChips = hasAccount && !isLoading && !hasLoadError

  const tokens = useMemo(() => getFormTokenAddresses(addresses, values), [addresses, values])
  const isExcluded = (address: string) => values.excludedTokens.some((excluded) => sameAddress(excluded, address))
  const isAllSelected = tokens.every((token) => !isExcluded(token))
  const addable = useMemo(
    () => options.filter((option) => !tokens.some((token) => sameAddress(token, option.address))),
    [options, tokens],
  )

  const toggle = (address: string, selected: boolean) =>
    onChange({
      ...values,
      excludedTokens: selected
        ? values.excludedTokens.filter((excluded) => !sameAddress(excluded, address))
        : [...values.excludedTokens, address],
    })

  const setAll = (selected: boolean) =>
    onChange({
      ...values,
      excludedTokens: selected ? [] : [...tokens],
    })

  const add = (address: string) => {
    onChange({
      ...values,
      addedTokens: [...values.addedTokens, address],
      excludedTokens: values.excludedTokens.filter((excluded) => !sameAddress(excluded, address)),
    })
    closeAdding()
  }

  const renderBody = () => {
    if (!hasAccount) return <AllowlistEmptyItem>{TOKENS_EMPTY_TEXT}</AllowlistEmptyItem>
    if (isLoading) {
      return (
        <div
          className="grid grid-cols-[repeat(auto-fill,minmax(8rem,1fr))] gap-2"
          data-testid="allowlist-tokens-loading"
        >
          {Array.from({ length: SKELETON_CHIP_COUNT }, (_, index) => (
            <Skeleton key={index} className="h-10 rounded-full" />
          ))}
        </div>
      )
    }
    if (hasLoadError) {
      return <LoadErrorAlert message={TOKENS_LOAD_ERROR_TEXT} onRetry={refetch} data-testid="allowlist-tokens-error" />
    }
    if (tokens.length === 0) return <AllowlistEmptyItem>{TOKENS_EMPTY_TEXT}</AllowlistEmptyItem>
    return (
      <div className="grid grid-cols-[repeat(auto-fill,minmax(8rem,1fr))] gap-2">
        {tokens.map((address) => {
          const option = findTokenOption(options, address)
          const label = option?.symbol || shortenAddress(address)
          return (
            <SelectableChip
              key={address}
              selected={!isExcluded(address)}
              onToggle={(selected) => toggle(address, selected)}
              aria-label={`Allow ${label}`}
              className="w-full min-w-0 justify-start"
            >
              <TokenIcon logoUri={option?.logoUri} tokenSymbol={label} size={TOKEN_ICON_SIZE} />
              <span className="min-w-0 flex-1 truncate text-left">{label}</span>
            </SelectableChip>
          )
        })}
      </div>
    )
  }

  return (
    <AllowlistSection
      title={TOKENS_SECTION_TITLE}
      description={hasAccount ? undefined : TOKENS_NO_ACCOUNT_DESCRIPTION}
      data-testid="allowlist-tokens-section"
    >
      {hasAccount && !isCalloutDismissed && (
        <DismissibleCallout
          className="mb-1"
          title={TOKENS_CALLOUT_TITLE}
          description={TOKENS_CALLOUT_DESCRIPTION}
          onDismiss={onDismissCallout}
          data-testid="allowlist-tokens-callout"
        />
      )}

      {renderBody()}

      {hasAccount && isPopularError && (
        <LoadErrorAlert
          message={POPULAR_LOAD_ERROR_TEXT}
          onRetry={refetchPopular}
          data-testid="allowlist-popular-tokens-error"
        />
      )}

      {isAdding && <TokenDraftRow options={addable} onConfirm={add} onCancel={closeAdding} />}

      <div className="flex items-center justify-between gap-2">
        {showsChips && tokens.length > 0 ? (
          <Button type="button" variant="ghost" size="sm" onClick={() => setAll(!isAllSelected)}>
            {isAllSelected ? DESELECT_ALL_LABEL : SELECT_ALL_LABEL}
          </Button>
        ) : (
          <span />
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!showsChips || isPopularLoading || addable.length === 0}
          onClick={() => setAddingFor(identityKey)}
        >
          <Plus data-icon="inline-start" />
          {ADD_TOKEN_LABEL}
        </Button>
      </div>
    </AllowlistSection>
  )
}

export default TokensSection
