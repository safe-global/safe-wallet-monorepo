import { useEffect, useId, useMemo, useRef, type ReactNode } from 'react'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import useSpendingLimitTokenOptions from '../hooks/useSpendingLimitTokenOptions'
import { useExistingLimitTokens } from '../hooks/useExistingLimitTokens'
import { findTokenOption, type TokenOption } from '../utils/tokenOptions'
import {
  TokenSelectorView,
  type TokenGroup,
} from '@views/features/spaces/components/Policies/SpendingLimitFlow/TokenSelector/TokenSelectorView'

export type TokenSelectorProps = {
  /** Token address; `ZERO_ADDRESS` for the native currency. */
  value?: string
  onChange: (address: string | undefined) => void
  /** Never hides `value` itself. Pass a stable reference — a new array each render recomputes the list. */
  excludeAddresses?: string[]
  /** Listed and searchable but not selectable; hovering one shows `disabledAddressReason`. */
  disabledAddresses?: string[]
  disabledAddressReason?: string
  disabled?: boolean
  label?: string
  placeholder?: string
  /** Marks the field invalid, as `NumberField` does. */
  error?: boolean
  /** Rendered under the field: the selected token's balance, or a validation message. */
  helperText?: ReactNode
  name?: string
  id?: string
  'data-testid'?: string
}

/** A `value` the current list does not know (edit flow, or a table change). Renders as its address. */
const unknownTokenOption = (address: string): TokenOption => ({
  address,
  symbol: '',
  name: '',
  decimals: 0,
  group: 'popular',
})

/** Search only: typing an address that is not in the list selects nothing. */
const TokenSelector = ({ value, onChange, excludeAddresses, id, ...props }: TokenSelectorProps) => {
  const generatedId = useId()
  const fieldId = id ?? generatedId
  const extraTokens = useExistingLimitTokens()
  const { options, isLoading, isError, refetch, isPopularLoading, isPopularError, refetchPopular, identityKey } =
    useSpendingLimitTokenOptions(extraTokens)

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

  // A token picked for one Safe must not survive a switch to another. `identityKey` goes empty for a
  // render mid-navigation, which is not a Safe change.
  const previousIdentity = useRef(identityKey)
  useEffect(() => {
    if (identityKey === '') return
    const previous = previousIdentity.current
    previousIdentity.current = identityKey
    if (previous !== '' && previous !== identityKey && value !== undefined) {
      onChange(undefined)
    }
  }, [identityKey, value, onChange])

  return (
    <TokenSelectorView
      {...props}
      fieldId={fieldId}
      groups={groups}
      selectedOption={selectedOption}
      onChange={onChange}
      hasSafe={hasSafe}
      isLoading={isLoading}
      isError={isError}
      onRetry={refetch}
      isPopularLoading={isPopularLoading}
      isPopularError={isPopularError}
      onRetryPopular={refetchPopular}
    />
  )
}

export default TokenSelector
