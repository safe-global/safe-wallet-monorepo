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
import useSpendingLimitTokenOptions from '../hooks/useSpendingLimitTokenOptions'
import { findTokenOption, tokenOptionLabel, type TokenOption } from '../utils/tokenOptions'
import { describeResetPeriod } from '../utils/resetPeriod'
import { validateLimitAmount, validateUniqueToken } from '../utils/validation'
import { limitPath, limitsPath, type SpendingLimitPolicyFormValues } from '../types'
import {
  FREQUENCY_LABEL,
  LIMIT_AMOUNT_LABEL,
  LIMIT_AMOUNT_PLACEHOLDER,
  PRICE_UNAVAILABLE_TEXT,
  REMOVE_LIMIT_LABEL,
} from '../constants'

export type LimitRowProps = {
  spenderIndex: number
  limitIndex: number
  /** How many rows the spender has — the other rows' token paths are this row's validation deps. */
  limitCount: number
  removable: boolean
  onRemove: () => void
}

const hasPrice = (token: TokenOption): boolean => !!token.fiatConversion && parseFloat(token.fiatConversion) > 0

/** What the typed amount is worth — or the defined fallback when the token has no price (spec D7). */
const FiatLine = ({ amount, token }: { amount: string; token: TokenOption | undefined }): ReactElement | null => {
  if (!token) return null
  if (!hasPrice(token)) return <span data-testid="amount-fiat">{PRICE_UNAVAILABLE_TEXT}</span>
  return (
    <span data-testid="amount-fiat">
      <FiatValue value={computeFiatValue(parseFloat(amount), token.fiatConversion) ?? 0} />
    </span>
  )
}

/** One (token, amount, frequency) limit of a spender. Renders inside the form's `FormProvider`. */
const LimitRow = ({ spenderIndex, limitIndex, limitCount, removable, onRemove }: LimitRowProps): ReactElement => {
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

  const tokenPath = limitPath(spenderIndex, limitIndex, 'tokenAddress')
  const amountPath = limitPath(spenderIndex, limitIndex, 'amount')
  const resetTimePath = limitPath(spenderIndex, limitIndex, 'resetTime')

  const tokenAddress = watch(tokenPath)
  const amount = watch(amountPath) ?? ''
  // RHF hands back the same mutated array every render, so key on the joined values, not the reference.
  const siblingTokensKey = (watch(limitsPath(spenderIndex)) ?? []).map((limit) => limit?.tokenAddress ?? '').join(',')

  /** Tokens the spender already uses on other rows — hidden from this row's list (spec D8). */
  const excludeAddresses = useMemo(
    () => siblingTokensKey.split(',').filter((address, index) => index !== limitIndex && address !== ''),
    [siblingTokensKey, limitIndex],
  )
  /** A token change on any sibling re-validates this row, so a duplicate created elsewhere shows up here too. */
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

  // react-hook-form only evaluates `isValid` on mount, so a typed amount must be re-checked once the
  // token (and therefore its decimals) becomes known or is lost.
  useEffect(() => {
    if (getValues(amountPath)) trigger(amountPath)
  }, [decimals, amountPath, getValues, trigger])

  const tokenError = get(errors, tokenPath)
  const amountError = get(errors, amountPath)

  return (
    <Card size="none" radius="lg" data-testid="limit-row">
      {/* Card owns spacing only via `size`/`radius`; the visual gap/padding lives on this plain div. */}
      <div className="flex flex-col gap-3 p-3">
        {/* Both columns render their own label and helper through the shared `Field` primitives, so
            the two fields line up without this row adding any vertical spacing of its own. */}
        <div className="flex items-start gap-4">
          <div className="flex min-w-0 flex-1 flex-col">
            <Controller
              control={control}
              name={tokenPath}
              rules={{
                required: NO_TOKEN_SELECTED_ERROR,
                deps: siblingTokenPaths,
                // Read the siblings at validation time: a memoised list would be one render behind.
                validate: (value) =>
                  validateUniqueToken(
                    value,
                    (getValues(limitsPath(spenderIndex)) ?? [])
                      .map((limit) => limit.tokenAddress)
                      .filter((_, index) => index !== limitIndex),
                  ),
              }}
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

          {removable && (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={REMOVE_LIMIT_LABEL}
              onClick={onRemove}
              data-testid="remove-limit-btn"
              className="mt-6"
            >
              <X />
            </Button>
          )}
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

export default LimitRow
