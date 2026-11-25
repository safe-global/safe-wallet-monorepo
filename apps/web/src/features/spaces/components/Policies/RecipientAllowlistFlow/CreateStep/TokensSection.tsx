import { useMemo, useState, type ReactElement } from 'react'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { Button } from '@safe-global/views/components/ui/button'
import StatusAlert from '@safe-global/views/components/common/StatusAlert'
import TokenIcon from '@/components/common/TokenIcon'
import { AllowlistSection } from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/AllowlistSection'
import SearchPicker, {
  type SearchPickerItem,
} from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/SearchPicker'
import SelectableChip from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/SelectableChip'
import {
  NO_TOKENS_FOUND_TEXT,
  POPULAR_LOAD_ERROR_TEXT,
  TOKEN_ICON_SIZE,
  TOKEN_LOOKUP_ERROR_TEXT,
  TOKEN_NOT_FOUND_TEXT,
  UNTRUSTED_TOKEN_WARNING,
} from '@safe-global/views/features/spaces/components/Policies/SpendingLimitFlow/TokenSelector/constants'
import {
  RETRY_LABEL,
  TOKENS_LOAD_ERROR_TEXT,
  TOKENS_SEARCH_PLACEHOLDER,
  TOKENS_SECTION_DESCRIPTION,
  TOKENS_SECTION_TITLE,
} from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/constants'
import useCustomTokenLookup from '../../SpendingLimitFlow/hooks/useCustomTokenLookup'
import { findTokenOption, tokenOptionLabel, type TokenOption } from '../../SpendingLimitFlow/utils/tokenOptions'
import type { HeldTokenAddresses } from '../hooks/useHeldTokenAddresses'
import type { AllowlistToken, RecipientAllowlistFormValues } from '../types'
import { toAllowlistTokens } from '../utils/allowlistDisplay'
import { selectAllowlistTokens, toggleByAddress } from '../utils/allowlistForm'

type TokensSectionProps = {
  values: RecipientAllowlistFormValues
  onChange: (next: RecipientAllowlistFormValues) => void
  heldTokens: HeldTokenAddresses
  hasAccount: boolean
}

const toAllowlistToken = (option: TokenOption): AllowlistToken => ({
  address: option.address,
  symbol: tokenOptionLabel(option),
  logoUri: option.logoUri,
})

const tokenIcon = ({ symbol, logoUri }: AllowlistToken): ReactElement => (
  <TokenIcon logoUri={logoUri} tokenSymbol={symbol} size={TOKEN_ICON_SIZE} />
)

const tokenDetail = (option: TokenOption): string | undefined => {
  if (option.untrusted) return UNTRUSTED_TOKEN_WARNING
  if (option.symbol && option.name) return option.name
  return option.symbol || option.name ? shortenAddress(option.address) : undefined
}

const toPickerItem = (option: TokenOption): SearchPickerItem => {
  const token = toAllowlistToken(option)
  return {
    id: option.address.toLowerCase(),
    label: token.symbol,
    detail: tokenDetail(option),
    searchText: `${option.name} ${option.address}`,
    icon: tokenIcon(token),
  }
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

/** The Safe's tokens and the popular ones to pick from, plus any ERC-20 whose address is pasted. */
const TokensSection = ({ values, onChange, heldTokens, hasAccount }: TokensSectionProps): ReactElement => {
  const { options, isLoading, isError, refetch, isPopularLoading, isPopularError, refetchPopular } = heldTokens
  const [query, setQuery] = useState('')
  const lookup = useCustomTokenLookup(query, options)

  const groups = useMemo(() => [{ id: 'tokens', items: options.map(toPickerItem) }], [options])
  const selectedIds = useMemo(() => values.tokens.map(({ address }) => address.toLowerCase()), [values.tokens])
  const chips = useMemo(
    () =>
      toAllowlistTokens(
        values.tokens.map(({ address }) => address),
        options,
        values.tokens,
      ),
    [values.tokens, options],
  )

  const setTokens = (tokens: AllowlistToken[]) => onChange({ ...values, tokens })

  const toggle = (token: AllowlistToken) => setTokens(toggleByAddress(values.tokens, token))

  const pick = ({ id }: SearchPickerItem) => {
    const option = findTokenOption(lookup.option ? [...options, lookup.option] : options, id)
    if (option) toggle(toAllowlistToken(option))
  }

  const selectAll = (ids: string[], isSelecting: boolean) =>
    setTokens(
      selectAllowlistTokens(
        values.tokens,
        options.filter(({ address }) => ids.includes(address.toLowerCase())).map(toAllowlistToken),
        isSelecting,
      ),
    )

  return (
    <AllowlistSection
      title={TOKENS_SECTION_TITLE}
      description={TOKENS_SECTION_DESCRIPTION}
      data-testid="allowlist-tokens-section"
    >
      <SearchPicker
        placeholder={TOKENS_SEARCH_PLACEHOLDER}
        groups={groups}
        selected={selectedIds}
        onToggle={pick}
        onSelectAll={selectAll}
        query={query}
        onQueryChange={setQuery}
        emptyLabel={lookup.address ? TOKEN_NOT_FOUND_TEXT : NO_TOKENS_FOUND_TEXT}
        extraItem={lookup.option && toPickerItem(lookup.option)}
        notice={lookup.isError ? { text: TOKEN_LOOKUP_ERROR_TEXT, onRetry: lookup.refetch } : undefined}
        isLoading={isLoading || isPopularLoading || lookup.isLoading}
        disabled={!hasAccount}
        data-testid="allowlist-tokens-search"
      />

      {hasAccount && isError && (
        <LoadErrorAlert message={TOKENS_LOAD_ERROR_TEXT} onRetry={refetch} data-testid="allowlist-tokens-error" />
      )}

      {hasAccount && isPopularError && (
        <LoadErrorAlert
          message={POPULAR_LOAD_ERROR_TEXT}
          onRetry={refetchPopular}
          data-testid="allowlist-popular-tokens-error"
        />
      )}

      {chips.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {chips.map((token) => (
            <SelectableChip
              key={token.address}
              selected
              onToggle={() => toggle(token)}
              aria-label={`Allow ${token.symbol}`}
              icon={tokenIcon(token)}
              label={token.symbol}
            />
          ))}
        </div>
      )}
    </AllowlistSection>
  )
}

export default TokensSection
