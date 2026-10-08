import type { ReactElement, ReactNode } from 'react'
import { Search } from 'lucide-react'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field'
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
import type {
  TokenOption,
  TokenOptionGroup,
} from '@/features/spaces/components/Policies/SpendingLimitFlow/utils/tokenOptions'
import { tokenOptionLabel } from '../utils/tokenOptionLabel'
import { matchesTokenQuery } from '../utils/tokenSearch'
import TokenOptionRow from './TokenOptionRow'
import DisabledTokenOption from './DisabledTokenOption'
import { TokenGroupError, TokenGroupLoading } from './TokenGroupState'
import {
  BALANCES_LOAD_ERROR_TEXT,
  HELD_GROUP_LABEL,
  NO_TOKENS_FOUND_TEXT,
  POPULAR_GROUP_LABEL,
  POPULAR_LOAD_ERROR_TEXT,
  TOKEN_FIELD_ICON_SIZE,
  TOKEN_SELECTOR_LABEL,
  TOKEN_SELECTOR_PLACEHOLDER,
} from './constants'

export type TokenGroup = { value: TokenOptionGroup; items: TokenOption[] }

export type TokenSelectorViewProps = {
  fieldId: string
  groups: TokenGroup[]
  selectedOption: TokenOption | null
  onChange: (address: string | undefined) => void
  hasSafe: boolean
  disabledAddresses?: string[]
  disabledAddressReason?: string
  disabled?: boolean
  label?: string
  placeholder?: string
  error?: boolean
  helperText?: ReactNode
  name?: string
  'data-testid'?: string
  isLoading: boolean
  isError: boolean
  onRetry: () => void
  isPopularLoading: boolean
  isPopularError: boolean
  onRetryPopular: () => void
}

const GROUP_LABELS: Record<TokenOptionGroup, string> = {
  held: HELD_GROUP_LABEL,
  popular: POPULAR_GROUP_LABEL,
}

const isSameOption = (a: TokenOption, b: TokenOption): boolean => sameAddress(a.address, b.address)

export const TokenSelectorView = ({
  fieldId,
  groups,
  selectedOption,
  onChange,
  hasSafe,
  disabledAddresses,
  disabledAddressReason,
  disabled = false,
  label = TOKEN_SELECTOR_LABEL,
  placeholder = TOKEN_SELECTOR_PLACEHOLDER,
  error = false,
  helperText,
  name,
  'data-testid': testId = 'spending-limit-token-selector',
  isLoading,
  isError,
  onRetry,
  isPopularLoading,
  isPopularError,
  onRetryPopular,
}: TokenSelectorViewProps): ReactElement => {
  // Base UI anchors the popup to the <input>; anchoring to the InputGroup makes it match the visible field.
  const fieldAnchor = useComboboxAnchor()

  return (
    /* `Field` rather than hand-rolled spacing, so this control and a `NumberField` beside it line up. */
    <Field data-invalid={error || undefined} className="w-full">
      <FieldLabel htmlFor={fieldId} className={error ? 'text-destructive' : undefined}>
        {label}
      </FieldLabel>

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
        autoHighlight
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
          {isLoading && <TokenGroupLoading label={HELD_GROUP_LABEL} data-testid="held-tokens-loading" />}
          {isError && (
            <TokenGroupError
              label={HELD_GROUP_LABEL}
              message={BALANCES_LOAD_ERROR_TEXT}
              onRetry={onRetry}
              data-testid="held-tokens-error"
            />
          )}
          <ComboboxList>
            {(group: TokenGroup) => (
              <ComboboxGroup key={group.value} items={group.items}>
                <ComboboxLabel>{GROUP_LABELS[group.value]}</ComboboxLabel>
                <ComboboxCollection>
                  {(option: TokenOption) =>
                    disabledAddresses?.some((address) => sameAddress(address, option.address)) ? (
                      <DisabledTokenOption key={option.address} option={option} reason={disabledAddressReason} />
                    ) : (
                      <ComboboxItem key={option.address} value={option} data-testid="token-option">
                        <TokenOptionRow option={option} />
                      </ComboboxItem>
                    )
                  }
                </ComboboxCollection>
              </ComboboxGroup>
            )}
          </ComboboxList>
          {isPopularLoading && <TokenGroupLoading label={POPULAR_GROUP_LABEL} data-testid="popular-tokens-loading" />}
          {isPopularError && (
            <TokenGroupError
              label={POPULAR_GROUP_LABEL}
              message={POPULAR_LOAD_ERROR_TEXT}
              onRetry={onRetryPopular}
              data-testid="popular-tokens-error"
            />
          )}
          {!isLoading && !isPopularLoading && <ComboboxEmpty>{NO_TOKENS_FOUND_TEXT}</ComboboxEmpty>}
        </ComboboxContent>
      </Combobox>

      {helperText != null && (
        <FieldDescription className={error ? 'text-destructive' : undefined}>{helperText}</FieldDescription>
      )}
    </Field>
  )
}
