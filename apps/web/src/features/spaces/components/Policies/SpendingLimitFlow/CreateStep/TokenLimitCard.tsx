import { useEffect, useMemo, type ReactElement } from 'react'
import { Controller, get, useFormContext } from 'react-hook-form'
import { getLocalDecimalSeparator } from '@safe-global/utils/utils/formatNumber'
import { getResetTimeOptions } from '@/features/spending-limits'
import { NO_TOKEN_SELECTED_ERROR } from '@/features/spending-limits/services'
import useChainId from '@/hooks/useChainId'
import { computeFiatValue } from '@/utils/fiat'
import NumberField from '@/components/common/NumberField'
import TokenSelector from '../TokenSelector'
import { useExistingSpendingLimits } from '../ExistingSpendingLimitsProvider'
import { useIsEditMode } from '@views/features/spaces/components/Policies/SpendingLimitFlow/EditFlow/EditModeContext'
import useSpendingLimitTokenOptions from '../hooks/useSpendingLimitTokenOptions'
import { useExistingLimitTokens } from '../hooks/useExistingLimitTokens'
import { findTokenOption, tokenOptionLabel } from '../utils/tokenOptions'
import { describeResetPeriod } from '../utils/resetPeriod'
import {
  existingTokensForSpender,
  validateLimitAmount,
  validateNoExistingLimit,
  validateUniqueToken,
} from '../utils/validation'
import {
  limitPath,
  limitsPath,
  spenderAddressPath,
  type SpendingLimitPolicyFormValues,
} from '@views/features/spaces/components/Policies/SpendingLimitFlow/types'
import { TokenLimitCardView } from '@views/features/spaces/components/Policies/SpendingLimitFlow/CreateStep/TokenLimitCardView'

export type TokenLimitCardProps = {
  spenderIndex: number
  limitIndex: number
  /** The other rows' token paths become this row's validation deps. */
  limitCount: number
  removable: boolean
  onRemove: () => void
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
  const extraTokens = useExistingLimitTokens()
  const { options } = useSpendingLimitTokenOptions(extraTokens)
  const { limits: existingLimits } = useExistingSpendingLimits()
  // An edit describes the Safe's whole policy, so its own limits are the rows to change, not conflicts.
  const isEditMode = useIsEditMode()
  const spenderAddress = watch(spenderAddressPath(spenderIndex)) ?? ''
  const existingTokens = useMemo(
    () => (isEditMode ? [] : existingTokensForSpender(spenderAddress, existingLimits)),
    [isEditMode, spenderAddress, existingLimits],
  )

  const tokenPath = limitPath(spenderIndex, limitIndex, 'tokenAddress')
  const amountPath = limitPath(spenderIndex, limitIndex, 'amount')
  const resetTimePath = limitPath(spenderIndex, limitIndex, 'resetTime')

  const tokenAddress = watch(tokenPath)
  const amount = watch(amountPath) ?? ''
  // RHF hands back the same mutated array every render, so key on the joined values, not the reference.
  const siblingTokensKey = (watch(limitsPath(spenderIndex)) ?? []).map((limit) => limit?.tokenAddress ?? '').join(',')

  /** Tokens the spender's other rows use — hidden from this row. */
  const excludeAddresses = useMemo(
    () => siblingTokensKey.split(',').filter((address, index) => index !== limitIndex && address !== ''),
    [siblingTokensKey, limitIndex],
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

    if (isEditMode) return validateUniqueToken(tokenAddress, siblingTokens)

    return (
      validateUniqueToken(tokenAddress, siblingTokens) ?? validateNoExistingLimit(tokenAddress, spender, existingLimits)
    )
  }

  const tokenError = get(errors, tokenPath)
  const amountError = get(errors, amountPath)

  return (
    <TokenLimitCardView
      removable={removable}
      onRemove={onRemove}
      renderTokenSelector={({ helperText, disabledAddressReason }) => (
        <Controller
          control={control}
          name={tokenPath}
          rules={{ required: NO_TOKEN_SELECTED_ERROR, deps: siblingTokenPaths, validate: validateTokenChoice }}
          render={({ field }) => (
            <TokenSelector
              value={field.value || undefined}
              onChange={(next) => field.onChange(next ?? '')}
              excludeAddresses={excludeAddresses}
              disabledAddresses={existingTokens}
              disabledAddressReason={disabledAddressReason}
              name={field.name}
              error={!!tokenError}
              helperText={helperText}
              data-testid="limit-token-selector"
            />
          )}
        />
      )}
      tokenErrorMessage={tokenError?.message ? String(tokenError.message) : undefined}
      tokenBalance={
        selectedToken?.balance !== undefined
          ? { balance: selectedToken.balance, decimals: selectedToken.decimals, label: tokenOptionLabel(selectedToken) }
          : undefined
      }
      renderAmountField={({ label, placeholder, helperText }) => (
        <NumberField
          label={label}
          placeholder={placeholder}
          fullWidth
          error={!!amountError}
          helperText={helperText}
          data-testid="limit-amount-input"
          {...register(amountPath, {
            // NumberField leaves at most one separator, the locale's; store it as a dot.
            setValueAs: (value: unknown) =>
              typeof value === 'string' ? value.replace(getLocalDecimalSeparator(), '.') : value,
            validate: (value) => validateLimitAmount(value, decimals),
          })}
        />
      )}
      amountErrorMessage={amountError?.message ? String(amountError.message) : undefined}
      hasSelectedToken={Boolean(selectedToken)}
      fiatValue={selectedToken ? computeFiatValue(parseFloat(amount), selectedToken.fiatConversion) : null}
      renderFrequencyField={(renderField) => (
        <Controller
          control={control}
          name={resetTimePath}
          rules={{ required: true }}
          render={({ field }) =>
            renderField({
              name: field.name,
              value: field.value,
              onChange: field.onChange,
              description: describeResetPeriod(resetTimeOptions.find((option) => option.value === field.value)),
            })
          }
        />
      )}
      resetTimeOptions={resetTimeOptions}
    />
  )
}

export default TokenLimitCard
