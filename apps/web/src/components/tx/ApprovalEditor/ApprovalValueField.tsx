import { _formatNumber } from '@/components/common/NumberField'
import { validateAmount, validateDecimalLength } from '@safe-global/utils/utils/validation'
import { useController, useFormContext } from 'react-hook-form'
import type { ApprovalInfo } from './hooks/useApprovalInfos'
import { PSEUDO_APPROVAL_VALUES } from '@safe-global/utils/components/tx/ApprovalEditor/utils/approvals'
import { TokenType } from '@safe-global/store/gateway/types'
import { ApprovalValueFieldView } from '@views/components/tx/ApprovalEditor/ApprovalValueFieldView'

export const ApprovalValueField = ({ name, tx, readOnly }: { name: string; tx: ApprovalInfo; readOnly: boolean }) => {
  const { control } = useFormContext()
  const selectValues: string[] = Object.values(PSEUDO_APPROVAL_VALUES)
  const {
    field: { ref, onBlur, onChange, value },
    fieldState,
  } = useController({
    name,
    control,
    rules: {
      required: true,
      validate: (val) => {
        if (selectValues.includes(val)) {
          return undefined
        }
        const decimals = tx.tokenInfo?.decimals
        return validateAmount(val, true) || validateDecimalLength(val, decimals)
      },
    },
  })

  const symbol = tx.tokenInfo?.symbol ?? ''
  const showAmountTooltip = tx.tokenInfo?.type === TokenType.ERC20
  const inputId = `${name}-approval-amount`

  // On free-text entry, reformat the number; preset values (e.g. "Unlimited amount") pass through untouched.
  const handleInputChange = (next: string) => {
    onChange(selectValues.includes(next) ? next : _formatNumber(next))
  }

  return (
    <ApprovalValueFieldView
      name={name}
      inputId={inputId}
      readOnly={readOnly}
      value={value}
      inputRef={ref}
      onBlur={onBlur}
      onInputChange={handleInputChange}
      selectValues={selectValues}
      errorMessage={fieldState.error?.message}
      hasError={!!fieldState.error}
      isDirty={fieldState.isDirty}
      method={tx.method}
      symbol={symbol}
      tokenType={tx.tokenInfo?.type}
      showAmountTooltip={showAmountTooltip}
    />
  )
}
