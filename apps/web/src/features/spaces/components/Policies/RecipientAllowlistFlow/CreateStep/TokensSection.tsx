import { useMemo, useState, type ReactElement } from 'react'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { Button } from '@safe-global/views/components/ui/button'
import StatusAlert from '@safe-global/views/components/common/StatusAlert'
import TokenIcon from '@/components/common/TokenIcon'
import { AllowlistSection } from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/AllowlistSection'
import PickerGroupHeader from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/PickerGroupHeader'
import SearchPicker, {
  type SearchPickerGroup,
  type SearchPickerItem,
} from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/SearchPicker'
import SelectableChip from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/SelectableChip'
import SpendingLimitTokenMark from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/SpendingLimitTokenMark'
import {
  NO_TOKENS_FOUND_TEXT,
  POPULAR_LOAD_ERROR_TEXT,
  TOKEN_ICON_SIZE,
  TOKEN_LOOKUP_ERROR_TEXT,
  UNTRUSTED_TOKEN_WARNING,
} from '@safe-global/views/features/spaces/components/Policies/SpendingLimitFlow/TokenSelector/constants'
import {
  NOT_ERC20_TOKEN_TEXT,
  OTHER_TOKENS_GROUP_LABEL,
  RETRY_LABEL,
  SPENDING_LIMIT_TOKENS_GROUP_LABEL,
  SPENDING_LIMITS_LOAD_ERROR_TEXT,
  TOKENS_LOAD_ERROR_TEXT,
  TOKENS_SEARCH_PLACEHOLDER,
  TOKENS_SECTION_DESCRIPTION,
  TOKENS_SECTION_TITLE,
  UNKNOWN_TOKEN_DETAIL,
} from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/constants'
import useCustomTokenLookup from '@/components/common/TokenSelector/useCustomTokenLookup'
import { findTokenOption, tokenOptionLabel, type TokenOption } from '@/utils/tokenOptions'
import type { HeldTokenAddresses } from '../hooks/useHeldTokenAddresses'
import type { SpendingLimitTokensResult } from '../hooks/useSpendingLimitTokens'
import type { AllowlistToken, RecipientAllowlistFormValues } from '../types'
import { toAllowlistTokens } from '../utils/allowlistDisplay'
import { selectAllowlistTokens, toggleByAddress } from '../utils/allowlistForm'

type TokensSectionProps = {
  values: RecipientAllowlistFormValues
  onChange: (next: RecipientAllowlistFormValues) => void
  heldTokens: HeldTokenAddresses
  /** Their tokens are suggested first and marked, since the allowlist blocks a spending limit on a token it leaves out. */
  spendingLimits: SpendingLimitTokensResult
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
  return option.symbol || option.name ? shortenAddress(option.address) : UNKNOWN_TOKEN_DETAIL
}

/** A pasted address CGW knows as no token; the allowlist only needs its address. */
const toUnknownTokenOption = (address: string): TokenOption => ({
  address,
  symbol: '',
  name: '',
  decimals: 0,
  group: 'custom',
})

const isListed = (tokens: readonly { address: string }[], address: string): boolean =>
  tokens.some((token) => sameAddress(token.address, address))

const toPickerItem = (option: TokenOption, isInSpendingLimit = false): SearchPickerItem => {
  const token = toAllowlistToken(option)
  return {
    id: option.address.toLowerCase(),
    label: token.symbol,
    labelSuffix: isInSpendingLimit ? <SpendingLimitTokenMark /> : undefined,
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

/** The tokens of the Safe's spending limits first, then its other tokens and the popular ones, plus any pasted ERC-20. */
const TokensSection = ({
  values,
  onChange,
  heldTokens,
  spendingLimits,
  hasAccount,
}: TokensSectionProps): ReactElement => {
  const { options, isLoading, isError, refetch, isPopularLoading, isPopularError, refetchPopular } = heldTokens
  const [query, setQuery] = useState('')
  const lookup = useCustomTokenLookup(query, options)
  const pastedOption =
    lookup.option ?? (lookup.address && lookup.isNotFound ? toUnknownTokenOption(lookup.address) : undefined)

  const isInSpendingLimit = (address: string) => isListed(spendingLimits.tokens, address)

  const groups = useMemo<SearchPickerGroup[]>(() => {
    const inSpendingLimits = options.filter(({ address }) => isListed(spendingLimits.tokens, address))
    const others = options.filter((option) => !inSpendingLimits.includes(option))
    if (inSpendingLimits.length === 0) return [{ id: 'tokens', items: others.map((option) => toPickerItem(option)) }]

    return [
      {
        id: 'spending-limits',
        header: <PickerGroupHeader label={SPENDING_LIMIT_TOKENS_GROUP_LABEL} count={inSpendingLimits.length} />,
        items: inSpendingLimits.map((option) => toPickerItem(option, true)),
      },
      {
        id: 'tokens',
        header: <PickerGroupHeader label={OTHER_TOKENS_GROUP_LABEL} count={others.length} />,
        items: others.map((option) => toPickerItem(option)),
      },
    ]
  }, [options, spendingLimits.tokens])
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
    const option = findTokenOption(pastedOption ? [...options, pastedOption] : options, id)
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
        emptyLabel={lookup.address ? NOT_ERC20_TOKEN_TEXT : NO_TOKENS_FOUND_TEXT}
        extraItem={pastedOption && toPickerItem(pastedOption, isInSpendingLimit(pastedOption.address))}
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

      {hasAccount && spendingLimits.isError && (
        <LoadErrorAlert
          message={SPENDING_LIMITS_LOAD_ERROR_TEXT}
          onRetry={spendingLimits.refetch}
          data-testid="allowlist-spending-limits-error"
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
              labelSuffix={isInSpendingLimit(token.address) ? <SpendingLimitTokenMark /> : undefined}
            />
          ))}
        </div>
      )}
    </AllowlistSection>
  )
}

export default TokensSection
