import { useEffect, useId, useMemo, useRef } from 'react'
import { Search } from 'lucide-react'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { Label } from '@/components/ui/label'
import { InputGroupAddon } from '@/components/ui/input-group'
import {
  Combobox,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxLabel,
  ComboboxList,
  useComboboxAnchor,
} from '@/components/ui/combobox'
import TokenIcon from '@/components/common/TokenIcon'
import useSpendingLimitTokenOptions from '../../hooks/useSpendingLimitTokenOptions'
import { findTokenOption, tokenOptionLabel, type TokenOption, type TokenOptionGroup } from '../../utils/tokenOptions'
import { matchesTokenQuery } from '../../utils/tokenSearch'
import TokenOptionRow from './TokenOptionRow'
import { HeldTokensError, HeldTokensLoading } from './HeldTokensState'
import {
  HELD_GROUP_LABEL,
  NO_TOKENS_FOUND_TEXT,
  POPULAR_GROUP_LABEL,
  TOKEN_FIELD_ICON_SIZE,
  TOKEN_SELECTOR_LABEL,
  TOKEN_SELECTOR_PLACEHOLDER,
} from './constants'

export type TokenSelectorProps = {
  /** Token address; `ZERO_ADDRESS` for the native currency. */
  value?: string
  onChange: (address: string | undefined) => void
  /**
   * Hidden from the list (e.g. tokens already used by the same spender). Never hides `value` itself.
   * Pass a stable reference (memoise) — a new array each render recomputes the list.
   */
  excludeAddresses?: string[]
  disabled?: boolean
  label?: string
  placeholder?: string
  name?: string
  id?: string
  'data-testid'?: string
}

/** Base UI group shape: items are filtered per group and empty groups are dropped. */
type TokenGroup = { value: TokenOptionGroup; items: TokenOption[] }

const GROUP_LABELS: Record<TokenOptionGroup, string> = {
  held: HELD_GROUP_LABEL,
  popular: POPULAR_GROUP_LABEL,
}

/** A `value` the current list does not know (edit flow, or a table change). Renders as its address. */
const unknownTokenOption = (address: string): TokenOption => ({
  address,
  symbol: '',
  name: '',
  decimals: 0,
  group: 'popular',
})

const isSameOption = (a: TokenOption, b: TokenOption): boolean => sameAddress(a.address, b.address)

/**
 * Chain-aware token picker for spending limits (WA-3149). Controlled and form-library agnostic.
 * Reads the Safe/chain through `useSpendingLimitTokenOptions`, so it follows a Space-level scope
 * when one is mounted and the URL Safe otherwise. Search only — typing an address that is not in
 * the list selects nothing.
 */
const TokenSelector = ({
  value,
  onChange,
  excludeAddresses,
  disabled = false,
  label = TOKEN_SELECTOR_LABEL,
  placeholder = TOKEN_SELECTOR_PLACEHOLDER,
  name,
  id,
  'data-testid': testId = 'spending-limit-token-selector',
}: TokenSelectorProps) => {
  const generatedId = useId()
  const fieldId = id ?? generatedId
  // Base UI anchors the popup to the <input>, not the field. Anchoring to the InputGroup makes the
  // popup exactly as wide as, and flush with, the visible field.
  const fieldAnchor = useComboboxAnchor()
  const { options, isLoading, isError, refetch, identityKey } = useSpendingLimitTokenOptions()

  const visibleOptions = useMemo(
    () =>
      options.filter(
        (option) =>
          sameAddress(option.address, value) ||
          !excludeAddresses?.some((excluded) => sameAddress(excluded, option.address)),
      ),
    [options, excludeAddresses, value],
  )

  const groups = useMemo<TokenGroup[]>(() => {
    const held = visibleOptions.filter((option) => option.group === 'held')
    const popular = visibleOptions.filter((option) => option.group === 'popular')
    return [
      ...(held.length ? [{ value: 'held' as const, items: held }] : []),
      ...(popular.length ? [{ value: 'popular' as const, items: popular }] : []),
    ]
  }, [visibleOptions])

  const selectedOption = useMemo<TokenOption | null>(
    () => (value ? (findTokenOption(options, value) ?? unknownTokenOption(value)) : null),
    [options, value],
  )

  const hasSafe = identityKey !== ''

  // AC C15: a token picked for Safe A must not survive switching to Safe B (different chain, different
  // decimals, possibly a different token behind the same address). Reset whenever the identity changes
  // after the first non-empty one — never on mount, never when a Safe is chosen for the first time.
  const previousIdentity = useRef(identityKey)
  useEffect(() => {
    const previous = previousIdentity.current
    previousIdentity.current = identityKey
    if (previous !== '' && previous !== identityKey && value !== undefined) {
      onChange(undefined)
    }
  }, [identityKey, value, onChange])

  return (
    <div className="flex w-full flex-col gap-1.5">
      <Label htmlFor={fieldId}>{label}</Label>

      <Combobox<TokenOption>
        items={groups}
        value={selectedOption}
        onValueChange={(next) => onChange(next?.address)}
        itemToStringLabel={tokenOptionLabel}
        itemToStringValue={(option) => option.address}
        isItemEqualToValue={isSameOption}
        filter={(item, query) => matchesTokenQuery(item, query)}
        disabled={disabled || !hasSafe}
        name={name}
        openOnInputClick
      >
        <div ref={fieldAnchor} className="w-full">
          <ComboboxInput
            id={fieldId}
            placeholder={placeholder}
            autoComplete="off"
            spellCheck={false}
            aria-label={label}
            disabled={disabled || !hasSafe}
            className="w-full"
            data-testid={testId}
          >
            <InputGroupAddon align="inline-start">
              {selectedOption ? (
                <TokenIcon
                  logoUri={selectedOption.logoUri}
                  tokenSymbol={tokenOptionLabel(selectedOption)}
                  size={TOKEN_FIELD_ICON_SIZE}
                />
              ) : (
                <Search className="text-muted-foreground size-4" />
              )}
            </InputGroupAddon>
          </ComboboxInput>
        </div>

        <ComboboxContent anchor={fieldAnchor}>
          {isLoading && <HeldTokensLoading />}
          {isError && <HeldTokensError onRetry={refetch} />}
          <ComboboxList>
            {(group: TokenGroup) => (
              <ComboboxGroup key={group.value} items={group.items}>
                <ComboboxLabel>{GROUP_LABELS[group.value]}</ComboboxLabel>
                <ComboboxCollection>
                  {(option: TokenOption) => (
                    <ComboboxItem key={option.address} value={option} data-testid="token-option">
                      <TokenOptionRow option={option} />
                    </ComboboxItem>
                  )}
                </ComboboxCollection>
              </ComboboxGroup>
            )}
          </ComboboxList>
          <ComboboxEmpty>{NO_TOKENS_FOUND_TEXT}</ComboboxEmpty>
        </ComboboxContent>
      </Combobox>
    </div>
  )
}

export default TokenSelector
