// Prototype copies of M1's spending-limit form (form, spender card, limit row, token selector) with the allowlist token check.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  type ReactElement,
  type ReactNode,
} from 'react'
import { CalendarClock, Plus, Search, Trash2, X } from 'lucide-react'
import { Controller, FormProvider, get, useFieldArray, useForm, useFormContext } from 'react-hook-form'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { formatVisualAmount } from '@safe-global/utils/utils/formatters'
import { getLocalDecimalSeparator } from '@safe-global/utils/utils/formatNumber'
import { addressIsNotCurrentSafe, addressIsNotReserved } from '@safe-global/utils/utils/validation'
import { getResetTimeOptions } from '@/features/spending-limits'
import { NO_TOKEN_SELECTED_ERROR } from '@/features/spending-limits/services'
import AddressBookInput from '@/components/common/AddressBookInput'
import FiatValue from '@/components/common/FiatValue'
import NumberField from '@/components/common/NumberField'
import TokenIcon from '@/components/common/TokenIcon'
import TxCard, { TxCardActions } from '@/components/tx-flow/common/TxCard'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Combobox as ComboboxPrimitive } from '@base-ui/react'
import { usePortalContainer } from '@/components/ui/ShadcnProvider'
import {
  Combobox,
  ComboboxCollection,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxLabel,
  ComboboxList,
  useComboboxAnchor,
} from '@/components/ui/combobox'
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field'
import { InputGroupAddon } from '@/components/ui/input-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import useChainId from '@/hooks/useChainId'
import useSafeInfo from '@/hooks/useSafeInfo'
import { cn } from '@/utils/cn'
import { computeFiatValue } from '@/utils/fiat'
import { findSafeAccount } from '../SafeAccountSelector/utils'
import type { SpendingLimitPolicyFormProps } from '../SpendingLimitFlow/CreateStep/SpendingLimitPolicyForm'
import type { SpenderCardProps } from '../SpendingLimitFlow/CreateStep/SpenderCard'
import type { TokenLimitCardProps } from '../SpendingLimitFlow/CreateStep/TokenLimitCard'
import { parseSafeScopeKey } from '@/components/tx-flow/safe-scope'
import { getNestedSafesNoticeText, NESTED_SAFES_NOTICE_TITLE } from '../SafeAccountSelector/constants'
import { AccountSelect } from './m2AccountSelect'
import SpenderCallout from '../SpendingLimitFlow/CreateStep/SpenderCallout'
import { useIsEditMode } from '../SpendingLimitFlow/EditFlow/EditModeContext'
import PendingRemovalsCard from '../SpendingLimitFlow/EditFlow/PendingRemovalsCard'
import { useEditState } from '../SpendingLimitFlow/EditFlow/useEditState'
import { useExistingSpendingLimits } from '../SpendingLimitFlow/ExistingSpendingLimitsProvider'
import { useExistingLimitTokens } from '../SpendingLimitFlow/hooks/useExistingLimitTokens'
import useSpendingLimitTokenOptions from '../SpendingLimitFlow/hooks/useSpendingLimitTokenOptions'
import type { TokenSelectorProps } from '../SpendingLimitFlow/TokenSelector'
import DisabledTokenOption from '../SpendingLimitFlow/TokenSelector/DisabledTokenOption'
import { TokenGroupError, TokenGroupLoading } from '../SpendingLimitFlow/TokenSelector/TokenGroupState'
import TokenOptionRow from '../SpendingLimitFlow/TokenSelector/TokenOptionRow'
import {
  BALANCES_LOAD_ERROR_TEXT,
  HELD_GROUP_LABEL,
  NO_TOKENS_FOUND_TEXT,
  POPULAR_GROUP_LABEL,
  POPULAR_LOAD_ERROR_TEXT,
  TOKEN_FIELD_ICON_SIZE,
  TOKEN_SELECTOR_LABEL,
  TOKEN_SELECTOR_PLACEHOLDER,
} from '../SpendingLimitFlow/TokenSelector/constants'
import {
  findTokenOption,
  tokenOptionLabel,
  type TokenOption,
  type TokenOptionGroup,
} from '../SpendingLimitFlow/utils/tokenOptions'
import { matchesTokenQuery } from '../SpendingLimitFlow/utils/tokenSearch'
import { describeResetPeriod } from '../SpendingLimitFlow/utils/resetPeriod'
import {
  existingTokensForSpender,
  validateLimitAmount,
  validateNoExistingLimit,
  validateUniqueSpender,
  validateUniqueToken,
} from '../SpendingLimitFlow/utils/validation'
import {
  createDefaultFormValues,
  createEmptyLimit,
  createEmptySpender,
  limitPath,
  limitsPath,
  spenderAddressPath,
  type SpendingLimitPolicyFormValues,
} from '../SpendingLimitFlow/types'
import {
  ADD_SPENDER_LABEL,
  ADD_TOKEN_LABEL,
  EXISTING_LIMIT_TOOLTIP,
  FREQUENCY_LABEL,
  LIMIT_AMOUNT_LABEL,
  LIMIT_AMOUNT_PLACEHOLDER,
  NEXT_LABEL,
  REMOVE_LIMIT_LABEL,
  REMOVE_SPENDER_LABEL,
  SPENDER_HELPER_TEXT,
  SPENDER_IS_SAFE_ERROR,
  SPENDER_LABEL,
  SPENDER_PLACEHOLDER,
  SPENDER_RESERVED_ERROR,
} from '../SpendingLimitFlow/constants'

const ICON_STROKE_WIDTH = 1.5

/** The selected account's recipient allowlist; null means no allowlist, so the form behaves exactly like M1's. */
export type AllowlistTokens = { allowedAddresses: string[]; accountName: string }

export const AllowlistTokensContext = createContext<AllowlistTokens | null>(null)

const getBlockedReason = (accountName: string): string =>
  `Blocked by the recipient allowlist on ${accountName}. It only lets allowed tokens be sent, so a spending limit for this one wouldn't work.`

type AllowlistTokenSelectorProps = TokenSelectorProps & {
  /** Listed but not selectable, like `disabledAddresses`, with their own tooltip. */
  blockedAddresses?: string[]
  blockedReason?: string
}

/** The UI kit's ComboboxContent, which takes no `collisionAvoidance`, so this copy never flips above the field. */
export const BelowComboboxContent = ({
  className,
  anchor,
  ...props
}: ComboboxPrimitive.Popup.Props & Pick<ComboboxPrimitive.Positioner.Props, 'anchor'>): ReactElement => {
  const portalContainer = usePortalContainer()
  return (
    <ComboboxPrimitive.Portal container={portalContainer}>
      <ComboboxPrimitive.Positioner
        side="bottom"
        sideOffset={4}
        align="start"
        anchor={anchor}
        collisionAvoidance={{ side: 'none' }}
        className="isolate z-[var(--z-overlay)]"
      >
        <ComboboxPrimitive.Popup
          data-slot="combobox-content"
          data-chips={!!anchor}
          className={cn(
            'bg-popover text-popover-foreground data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 ring-foreground/10 max-h-72 min-w-36 overflow-hidden rounded-lg shadow-md ring-1 duration-100 relative max-h-(--available-height) w-(--anchor-width) max-w-(--available-width) origin-(--transform-origin) data-[chips=true]:min-w-(--anchor-width)',
            className,
          )}
          {...props}
        />
      </ComboboxPrimitive.Positioner>
    </ComboboxPrimitive.Portal>
  )
}

type TokenGroup = { value: TokenOptionGroup; items: TokenOption[] }

const GROUP_LABELS: Record<TokenOptionGroup, string> = {
  held: HELD_GROUP_LABEL,
  popular: POPULAR_GROUP_LABEL,
}

const unknownTokenOption = (address: string): TokenOption => ({
  address,
  symbol: '',
  name: '',
  decimals: 0,
  group: 'popular',
})

const isSameOption = (a: TokenOption, b: TokenOption): boolean => sameAddress(a.address, b.address)

const AllowlistTokenSelector = ({
  value,
  onChange,
  excludeAddresses,
  disabledAddresses,
  disabledAddressReason,
  blockedAddresses,
  blockedReason,
  disabled = false,
  label = TOKEN_SELECTOR_LABEL,
  placeholder = TOKEN_SELECTOR_PLACEHOLDER,
  error = false,
  helperText,
  name,
  id,
  'data-testid': testId = 'spending-limit-token-selector',
}: AllowlistTokenSelectorProps) => {
  const generatedId = useId()
  const fieldId = id ?? generatedId
  const fieldAnchor = useComboboxAnchor()
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

  const previousIdentity = useRef(identityKey)
  useEffect(() => {
    if (identityKey === '') return
    const previous = previousIdentity.current
    previousIdentity.current = identityKey
    if (previous !== '' && previous !== identityKey && value !== undefined) {
      onChange(undefined)
    }
  }, [identityKey, value, onChange])

  const renderOption = (option: TokenOption): ReactElement => {
    if (disabledAddresses?.some((address) => sameAddress(address, option.address))) {
      return <DisabledTokenOption key={option.address} option={option} reason={disabledAddressReason} />
    }
    if (blockedAddresses?.some((address) => sameAddress(address, option.address))) {
      return <DisabledTokenOption key={option.address} option={option} reason={blockedReason} />
    }
    return (
      <ComboboxItem key={option.address} value={option} data-testid="token-option">
        <TokenOptionRow option={option} />
      </ComboboxItem>
    )
  }

  return (
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

        <BelowComboboxContent
          anchor={fieldAnchor}
          data-m2-dropdown=""
          data-m2-new="M1 copy · Token dropdown (allowlist check)"
          data-m2-new-corner="end"
        >
          {isLoading && <TokenGroupLoading label={HELD_GROUP_LABEL} data-testid="held-tokens-loading" />}
          {isError && (
            <TokenGroupError
              label={HELD_GROUP_LABEL}
              message={BALANCES_LOAD_ERROR_TEXT}
              onRetry={refetch}
              data-testid="held-tokens-error"
            />
          )}
          <ComboboxList>
            {(group: TokenGroup) => (
              <ComboboxGroup key={group.value} items={group.items}>
                <ComboboxLabel>{GROUP_LABELS[group.value]}</ComboboxLabel>
                <ComboboxCollection>{renderOption}</ComboboxCollection>
              </ComboboxGroup>
            )}
          </ComboboxList>
          {isPopularLoading && <TokenGroupLoading label={POPULAR_GROUP_LABEL} data-testid="popular-tokens-loading" />}
          {isPopularError && (
            <TokenGroupError
              label={POPULAR_GROUP_LABEL}
              message={POPULAR_LOAD_ERROR_TEXT}
              onRetry={refetchPopular}
              data-testid="popular-tokens-error"
            />
          )}
          {!isLoading && !isPopularLoading && <ComboboxEmpty>{NO_TOKENS_FOUND_TEXT}</ComboboxEmpty>}
        </BelowComboboxContent>
      </Combobox>

      {helperText != null && (
        <FieldDescription className={error ? 'text-destructive' : undefined}>{helperText}</FieldDescription>
      )}
    </Field>
  )
}

const HelperLine = ({ children }: { children?: ReactNode }): ReactElement => (
  <span className="block min-h-lh">{children}</span>
)

const FiatLine = ({ amount, token }: { amount: string; token: TokenOption }): ReactElement | null => {
  const fiat = computeFiatValue(parseFloat(amount), token.fiatConversion)
  if (fiat === null) return null

  return (
    <span data-testid="amount-fiat">
      <FiatValue value={fiat} />
    </span>
  )
}

const AllowlistTokenLimitCard = ({
  spenderIndex,
  limitIndex,
  limitCount,
  removable,
  onRemove,
}: TokenLimitCardProps): ReactElement => {
  const chainId = useChainId()
  const {
    control,
    register,
    watch,
    getValues,
    trigger,
    formState: { errors },
  } = useFormContext<SpendingLimitPolicyFormValues>()
  const extraTokens = useExistingLimitTokens()
  const { options } = useSpendingLimitTokenOptions(extraTokens)
  const { limits: existingLimits } = useExistingSpendingLimits()
  const allowlist = useContext(AllowlistTokensContext)
  const isEditMode = useIsEditMode()
  const spenderAddress = watch(spenderAddressPath(spenderIndex)) ?? ''
  const existingTokens = useMemo(
    () => (isEditMode ? [] : existingTokensForSpender(spenderAddress, existingLimits)),
    [isEditMode, spenderAddress, existingLimits],
  )

  const blockedAddresses = useMemo(
    () =>
      allowlist
        ? options
            .filter((option) => !allowlist.allowedAddresses.some((allowed) => sameAddress(allowed, option.address)))
            .map((option) => option.address)
        : undefined,
    [allowlist, options],
  )

  const tokenPath = limitPath(spenderIndex, limitIndex, 'tokenAddress')
  const amountPath = limitPath(spenderIndex, limitIndex, 'amount')
  const resetTimePath = limitPath(spenderIndex, limitIndex, 'resetTime')

  const tokenAddress = watch(tokenPath)
  const amount = watch(amountPath) ?? ''
  const siblingTokensKey = (watch(limitsPath(spenderIndex)) ?? []).map((limit) => limit?.tokenAddress ?? '').join(',')

  const excludeAddresses = useMemo(
    () => siblingTokensKey.split(',').filter((address, index) => index !== limitIndex && address !== ''),
    [siblingTokensKey, limitIndex],
  )
  const siblingTokenPaths = useMemo(
    () =>
      Array.from({ length: limitCount }, (_, index) => limitPath(spenderIndex, index, 'tokenAddress')).filter(
        (_, index) => index !== limitIndex,
      ),
    [limitCount, spenderIndex, limitIndex],
  )

  const selectedToken = useMemo(() => findTokenOption(options, tokenAddress), [options, tokenAddress])
  const decimals = selectedToken?.decimals
  const resetTimeOptions = useMemo(() => getResetTimeOptions(chainId), [chainId])

  useEffect(() => {
    if (getValues(amountPath)) trigger(amountPath)
  }, [decimals, amountPath, getValues, trigger])

  const existingTokensKey = existingTokens.join(',')
  useEffect(() => {
    if (existingLimits !== undefined && getValues(tokenPath)) trigger(tokenPath)
  }, [existingTokensKey, existingLimits, tokenPath, getValues, trigger])

  const validateTokenChoice = (tokenAddress: string): string | undefined => {
    const siblingTokens = (getValues(limitsPath(spenderIndex)) ?? [])
      .map((limit) => limit.tokenAddress)
      .filter((_, index) => index !== limitIndex)
    const spender = getValues(spenderAddressPath(spenderIndex)) ?? ''

    if (isEditMode) return validateUniqueToken(tokenAddress, siblingTokens)

    return (
      validateUniqueToken(tokenAddress, siblingTokens) ?? validateNoExistingLimit(tokenAddress, spender, existingLimits)
    )
  }

  const tokenError = get(errors, tokenPath)
  const amountError = get(errors, amountPath)

  return (
    <Card variant="muted-nested" size="none" radius="lg" className="relative" data-testid="token-limit-card">
      {removable && (
        <Button
          type="button"
          variant="ghost-destructive"
          size="icon-circle"
          aria-label={REMOVE_LIMIT_LABEL}
          onClick={onRemove}
          data-testid="remove-limit-btn"
          className="absolute top-2 right-2"
        >
          <X strokeWidth={ICON_STROKE_WIDTH} />
        </Button>
      )}

      <div className="flex flex-col gap-3 p-3">
        <div className="flex items-start gap-4">
          <div className="flex min-w-0 flex-1 flex-col">
            <Controller
              control={control}
              name={tokenPath}
              rules={{ required: NO_TOKEN_SELECTED_ERROR, deps: siblingTokenPaths, validate: validateTokenChoice }}
              render={({ field }) => (
                <AllowlistTokenSelector
                  value={field.value || undefined}
                  onChange={(next) => field.onChange(next ?? '')}
                  excludeAddresses={excludeAddresses}
                  disabledAddresses={existingTokens}
                  disabledAddressReason={EXISTING_LIMIT_TOOLTIP}
                  blockedAddresses={blockedAddresses}
                  blockedReason={allowlist ? getBlockedReason(allowlist.accountName) : undefined}
                  name={field.name}
                  error={!!tokenError}
                  helperText={
                    <HelperLine>
                      {tokenError?.message ? (
                        <span data-testid="token-error">{String(tokenError.message)}</span>
                      ) : selectedToken?.balance !== undefined ? (
                        <span data-testid="token-balance">
                          {formatVisualAmount(selectedToken.balance, selectedToken.decimals)}{' '}
                          {tokenOptionLabel(selectedToken)}
                        </span>
                      ) : null}
                    </HelperLine>
                  }
                  data-testid="limit-token-selector"
                />
              )}
            />
          </div>

          <div className="flex min-w-0 flex-1 flex-col">
            <NumberField
              label={LIMIT_AMOUNT_LABEL}
              placeholder={LIMIT_AMOUNT_PLACEHOLDER}
              fullWidth
              error={!!amountError}
              helperText={
                <HelperLine>
                  {amountError?.message ? (
                    String(amountError.message)
                  ) : selectedToken ? (
                    <FiatLine amount={amount} token={selectedToken} />
                  ) : null}
                </HelperLine>
              }
              data-testid="limit-amount-input"
              {...register(amountPath, {
                setValueAs: (value: unknown) =>
                  typeof value === 'string' ? value.replace(getLocalDecimalSeparator(), '.') : value,
                validate: (value) => validateLimitAmount(value, decimals),
              })}
            />
          </div>
        </div>

        <Controller
          control={control}
          name={resetTimePath}
          rules={{ required: true }}
          render={({ field }) => {
            const triggerId = `${field.name}-frequency`
            const selected = resetTimeOptions.find((option) => option.value === field.value)
            return (
              <Field>
                <FieldLabel htmlFor={triggerId}>{FREQUENCY_LABEL}</FieldLabel>
                <Select items={resetTimeOptions} value={field.value} onValueChange={(value) => field.onChange(value)}>
                  <SelectTrigger id={triggerId} className="w-full" data-testid="frequency-select">
                    <CalendarClock className="text-muted-foreground" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent alignItemWithTrigger={false} side="bottom" collisionAvoidance={{ side: 'none' }}>
                    {resetTimeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value} data-testid="frequency-item">
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldDescription data-testid="frequency-helper">{describeResetPeriod(selected)}</FieldDescription>
              </Field>
            )
          }}
        />
      </div>
    </Card>
  )
}

const AllowlistSpenderCard = ({ spenderIndex, spenderCount, removable, onRemove }: SpenderCardProps): ReactElement => {
  const { control, getValues, watch } = useFormContext<SpendingLimitPolicyFormValues>()
  const { fields, append, remove } = useFieldArray({ control, name: limitsPath(spenderIndex) })
  const isEditMode = useIsEditMode()
  const { safeAddress } = useSafeInfo()
  const { limits: existingLimits } = useExistingSpendingLimits()
  const address = watch(spenderAddressPath(spenderIndex)) ?? ''
  const isFixed = isEditMode && (existingLimits ?? []).some((limit) => sameAddress(limit.beneficiary, address))

  const otherSpenderPaths = useMemo(
    () =>
      Array.from({ length: spenderCount }, (_, index) => spenderAddressPath(index)).filter(
        (_, index) => index !== spenderIndex,
      ),
    [spenderCount, spenderIndex],
  )

  const validateSpender = useCallback(
    (address: string) =>
      addressIsNotReserved(SPENDER_RESERVED_ERROR)(address) ??
      addressIsNotCurrentSafe(safeAddress, SPENDER_IS_SAFE_ERROR)(address) ??
      validateUniqueSpender(
        address,
        (getValues('spenders') ?? []).map((spender) => spender.address).filter((_, index) => index !== spenderIndex),
      ),
    [getValues, spenderIndex, safeAddress],
  )

  const otherSpendersKey = (watch('spenders') ?? [])
    .map((spender) => spender?.address ?? '')
    .filter((_, index) => index !== spenderIndex)
    .join(',')
  const excludeAddresses = useMemo(() => otherSpendersKey.split(',').filter(Boolean), [otherSpendersKey])

  return (
    <Card variant="muted" size="none" radius="xl" className="relative" data-testid="spender-card">
      <div className="flex flex-col gap-4 p-4">
        {removable && (
          <Button
            type="button"
            variant="ghost-destructive"
            size="icon-circle"
            aria-label={REMOVE_SPENDER_LABEL}
            onClick={onRemove}
            data-testid="remove-spender-btn"
            className="absolute top-2 right-2 z-10"
          >
            <Trash2 strokeWidth={ICON_STROKE_WIDTH} />
          </Button>
        )}

        <div className={cn('flex flex-col gap-1', isFixed && 'cursor-not-allowed opacity-50')}>
          <AddressBookInput
            name={spenderAddressPath(spenderIndex)}
            label={SPENDER_LABEL}
            placeholder={SPENDER_PLACEHOLDER}
            validate={validateSpender}
            deps={otherSpenderPaths}
            excludeAddresses={excludeAddresses}
            disabled={isFixed}
            data-testid="spender-address-input"
          />
          <FieldDescription>{SPENDER_HELPER_TEXT}</FieldDescription>
        </div>

        <div className="flex flex-col gap-3">
          {fields.map((field, index) => (
            <AllowlistTokenLimitCard
              key={field.id}
              spenderIndex={spenderIndex}
              limitIndex={index}
              limitCount={fields.length}
              removable={fields.length > 1}
              onRemove={() => remove(index)}
            />
          ))}
        </div>

        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => append(createEmptyLimit())}
            data-testid="add-token-btn"
          >
            <Plus />
            {ADD_TOKEN_LABEL}
          </Button>
        </div>
      </div>
    </Card>
  )
}

export const AllowlistSpendingLimitForm = ({
  defaultValues,
  onSubmit,
  accounts,
  onSafeChange,
  scopeKey,
  onSpendersChange,
  isCalloutDismissed,
  onDismissCallout,
}: SpendingLimitPolicyFormProps): ReactElement => {
  const formMethods = useForm<SpendingLimitPolicyFormValues>({ defaultValues, mode: 'onChange' })
  const { control, handleSubmit, formState, watch, getValues, reset } = formMethods
  const { fields, append, remove } = useFieldArray({ control, name: 'spenders' })
  const isEditMode = useIsEditMode()
  const { removalCopy, discardChanges, isUnchangedEdit } = useEditState(formMethods)

  const previousScopeKey = useRef(scopeKey)
  useEffect(() => {
    const previous = previousScopeKey.current
    previousScopeKey.current = scopeKey
    if (isEditMode || previous === undefined || previous === scopeKey) return

    reset({ ...createDefaultFormValues(), safe: getValues('safe') })
  }, [isEditMode, scopeKey, getValues, reset])

  const spenders = watch('spenders') ?? []
  const spenderAddressesKey = spenders.map((spender) => spender?.address ?? '').join(',')
  useEffect(() => {
    onSpendersChange?.(spenderAddressesKey.split(',').filter(Boolean))
  }, [spenderAddressesKey, onSpendersChange])

  const selectedSafe = findSafeAccount(accounts, watch('safe'))
  const isSafeBlocked = !isEditMode && (!selectedSafe || Boolean(selectedSafe.ineligibleReason))

  return (
    <TxCard>
      <FormProvider {...formMethods}>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-5"
          data-testid="spending-limit-policy-form"
          data-m2-new="M1 copy · Spending limit form"
        >
          {!isEditMode && <SpenderCallout dismissed={isCalloutDismissed} onDismiss={onDismissCallout} />}

          <Controller
            control={control}
            name="safe"
            rules={{ required: true }}
            render={({ field }) => (
              <AccountSelect
                accounts={accounts}
                value={field.value || undefined}
                onChange={(id) => {
                  field.onChange(id)
                  const target = parseSafeScopeKey(id)
                  if (target) onSafeChange(target.chainId, target.safeAddress)
                }}
                notice={{ title: NESTED_SAFES_NOTICE_TITLE, description: getNestedSafesNoticeText('spending limits') }}
                id="spending-limit-safe-account"
              />
            )}
          />

          {removalCopy && <PendingRemovalsCard copy={removalCopy} onDiscard={discardChanges} />}

          {fields.map((field, index) => (
            <AllowlistSpenderCard
              key={field.id}
              spenderIndex={index}
              spenderCount={fields.length}
              removable={isEditMode || fields.length > 1}
              onRemove={() => remove(index)}
            />
          ))}

          <div>
            <Button
              type="button"
              variant="secondary"
              onClick={() => append(createEmptySpender())}
              data-testid="add-spender-btn"
            >
              <Plus />
              {ADD_SPENDER_LABEL}
            </Button>
          </div>

          <TxCardActions>
            <Button
              type="submit"
              size="submit"
              disabled={!formState.isValid || isSafeBlocked || isUnchangedEdit}
              data-testid="next-btn"
            >
              {NEXT_LABEL}
            </Button>
          </TxCardActions>
        </form>
      </FormProvider>
    </TxCard>
  )
}
