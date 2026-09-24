import { useEffect, useMemo, type ReactElement } from 'react'
import { CalendarClock, X } from 'lucide-react'
import { Controller, get, useFormContext } from 'react-hook-form'
import { formatVisualAmount } from '@safe-global/utils/utils/formatters'
import { getResetTimeOptions } from '@/features/spending-limits'
import { NO_TOKEN_SELECTED_ERROR } from '@/features/spending-limits/services'
import useChainId from '@/hooks/useChainId'
import { computeFiatValue } from '@/utils/fiat'
import FiatValue from '@/components/common/FiatValue'
import NumberField from '@/components/common/NumberField'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import TokenSelector from '../TokenSelector'
import { useExistingSpendingLimits } from '../ExistingSpendingLimitsProvider'
import useSpendingLimitTokenOptions from '../hooks/useSpendingLimitTokenOptions'
import { findTokenOption, tokenOptionLabel, type TokenOption } from '../utils/tokenOptions'
import { describeResetPeriod } from '../utils/resetPeriod'
import {
  existingTokensForSpender,
  validateLimitAmount,
  validateNoExistingLimit,
  validateUniqueToken,
} from '../utils/validation'
import { limitPath, limitsPath, spenderAddressPath, type SpendingLimitPolicyFormValues } from '../types'
import {
  FREQUENCY_LABEL,
  LIMIT_AMOUNT_LABEL,
  LIMIT_AMOUNT_PLACEHOLDER,
  PRICE_UNAVAILABLE_TEXT,
  REMOVE_LIMIT_LABEL,
} from '../constants'

/** Figma draws the remove glyph at lucide's 1.5 stroke, not its default 2. */
const ICON_STROKE_WIDTH = 1.5

export type TokenLimitCardProps = {
  spenderIndex: number
  limitIndex: number
  /** The other rows' token paths become this row's validation deps. */
  limitCount: number
  removable: boolean
  onRemove: () => void
}

const hasPrice = (token: TokenOption): boolean => !!token.fiatConversion && parseFloat(token.fiatConversion) > 0

const FiatLine = ({ amount, token }: { amount: string; token: TokenOption | undefined }): ReactElement | null => {
  if (!token) return null
  if (!hasPrice(token)) return <span data-testid="amount-fiat">{PRICE_UNAVAILABLE_TEXT}</span>

  // Nothing typed yet is not worth $0.00 — `computeFiatValue` returns null for that, and for anything
  // else it cannot price, so say nothing rather than coercing it to a figure.
  const fiat = computeFiatValue(parseFloat(amount), token.fiatConversion)
  if (fiat === null) return null

  return (
    <span data-testid="amount-fiat">
      <FiatValue value={fiat} />
    </span>
  )
}

const TokenLimitCard = ({
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
  const { options } = useSpendingLimitTokenOptions()
  const { limits: existingLimits } = useExistingSpendingLimits()
  const spenderAddress = watch(spenderAddressPath(spenderIndex)) ?? ''
  const existingTokens = useMemo(
    () => existingTokensForSpender(spenderAddress, existingLimits),
    [spenderAddress, existingLimits],
  )

  const tokenPath = limitPath(spenderIndex, limitIndex, 'tokenAddress')
  const amountPath = limitPath(spenderIndex, limitIndex, 'amount')
  const resetTimePath = limitPath(spenderIndex, limitIndex, 'resetTime')

  const tokenAddress = watch(tokenPath)
  const amount = watch(amountPath) ?? ''
  // RHF hands back the same mutated array every render, so key on the joined values, not the reference.
  const siblingTokensKey = (watch(limitsPath(spenderIndex)) ?? []).map((limit) => limit?.tokenAddress ?? '').join(',')

  /** Tokens the spender's other rows use, plus those the Safe already limits for this spender — hidden from this row. */
  const excludeAddresses = useMemo(
    () => [
      ...siblingTokensKey.split(',').filter((address, index) => index !== limitIndex && address !== ''),
      ...existingTokens,
    ],
    [siblingTokensKey, limitIndex, existingTokens],
  )
  /** A token change on a sibling re-validates this row, so a duplicate shows on both. */
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

  // The amount's rule needs the token's decimals, so re-check a typed amount when the token changes.
  useEffect(() => {
    if (getValues(amountPath)) trigger(amountPath)
  }, [decimals, amountPath, getValues, trigger])

  // Keyed on the exclusions' values, not the array: every spender keystroke produces a new one, and re-validating
  // on each would show this row's errors before it has been filled in.
  const existingTokensKey = existingTokens.join(',')
  useEffect(() => {
    if (existingLimits !== undefined && getValues(tokenPath)) trigger(tokenPath)
  }, [existingTokensKey, existingLimits, tokenPath, getValues, trigger])

  // Read at validation time: a memo of the sibling rows would be one render behind.
  const validateTokenChoice = (tokenAddress: string): string | undefined => {
    const siblingTokens = (getValues(limitsPath(spenderIndex)) ?? [])
      .map((limit) => limit.tokenAddress)
      .filter((_, index) => index !== limitIndex)
    const spender = getValues(spenderAddressPath(spenderIndex)) ?? ''

    return (
      validateUniqueToken(tokenAddress, siblingTokens) ?? validateNoExistingLimit(tokenAddress, spender, existingLimits)
    )
  }

  const tokenError = get(errors, tokenPath)
  const amountError = get(errors, amountPath)

  return (
    <Card variant="muted-nested" size="none" radius="lg" className="relative" data-testid="token-limit-card">
      {/* Corner-pinned so it never narrows the two fields. */}
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

      {/* `Card` takes spacing only through `size`/`radius`, so the padding lives on this div. */}
      <div className="flex flex-col gap-3 p-3">
        {/* Both columns bring their own label and helper via `Field`, so they line up with no spacing here. */}
        <div className="flex items-start gap-4">
          <div className="flex min-w-0 flex-1 flex-col">
            <Controller
              control={control}
              name={tokenPath}
              rules={{ required: NO_TOKEN_SELECTED_ERROR, deps: siblingTokenPaths, validate: validateTokenChoice }}
              render={({ field }) => (
                <TokenSelector
                  value={field.value || undefined}
                  onChange={(next) => field.onChange(next ?? '')}
                  excludeAddresses={excludeAddresses}
                  name={field.name}
                  error={!!tokenError}
                  helperText={
                    tokenError?.message ? (
                      <span data-testid="token-error">{String(tokenError.message)}</span>
                    ) : selectedToken ? (
                      <span data-testid="token-balance">
                        {formatVisualAmount(selectedToken.balance ?? '0', selectedToken.decimals)}{' '}
                        {tokenOptionLabel(selectedToken)}
                      </span>
                    ) : undefined
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
                amountError?.message ? (
                  String(amountError.message)
                ) : selectedToken ? (
                  <FiatLine amount={amount} token={selectedToken} />
                ) : undefined
              }
              data-testid="limit-amount-input"
              {...register(amountPath, { validate: (value) => validateLimitAmount(value, decimals) })}
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
                  <SelectContent>
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

export default TokenLimitCard
