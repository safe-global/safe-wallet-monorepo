import NumberField from '@/components/common/NumberField'
import { validateAmount, validateDecimalLength } from '@safe-global/utils/utils/validation'
import { Autocomplete, type MenuItemProps, MenuItem } from '@mui/material'
import { useController, useFormContext } from 'react-hook-form'
import type { ApprovalInfo } from './hooks/useApprovalInfos'
import css from './styles.module.css'
import { PSEUDO_APPROVAL_VALUES } from './utils/approvals'
import { approvalMethodDescription } from './ApprovalItem'

const ApprovalOption = ({ menuItemProps, value }: { menuItemProps: MenuItemProps; value: string }) => {
  return (
    <MenuItem key={value} {...menuItemProps}>
      {value}
    </MenuItem>
  )
}

export const ApprovalValueField = ({ name, tx, readOnly }: { name: string; tx: ApprovalInfo; readOnly: boolean }) => {
  const { control } = useFormContext()
  const selectValues = Object.values(PSEUDO_APPROVAL_VALUES)
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

  const helperText = fieldState.error?.message ?? (fieldState.isDirty ? 'Save to apply changes' : '')

  const label = `${approvalMethodDescription[tx.method](tx.tokenInfo?.symbol ?? '')}`
  const options = selectValues

  return (
    <Autocomplete
      freeSolo
      fullWidth
      options={options}
      renderOption={(props, value: string) => <ApprovalOption key={value} menuItemProps={props} value={value} />}
      value={value}
      // On option select or free text entry
      onInputChange={(_, value) => {
        onChange(value)
      }}
      disableClearable
      selectOnFocus={!readOnly}
      readOnly={readOnly}
      componentsProps={{
        paper: {
          elevation: 2,
        },
      }}
      renderInput={(params) => {
        // Extract Autocomplete's ref from params
        const autocompleteRef = params.inputProps.ref

        // Create combined ref that applies both Autocomplete's and react-hook-form's refs
        const combinedRef = (node: HTMLInputElement | null) => {
          // Apply Autocomplete's ref
          if (typeof autocompleteRef === 'function') {
            autocompleteRef(node)
          } else if (autocompleteRef && typeof autocompleteRef === 'object' && 'current' in autocompleteRef) {
            ;(autocompleteRef as React.RefObject<HTMLInputElement | null>).current = node
          }
          // Apply react-hook-form's ref
          if (typeof ref === 'function') {
            ref(node)
          } else if (ref && typeof ref === 'object' && 'current' in ref) {
            ;(ref as React.RefObject<HTMLInputElement | null>).current = node
          }
        }

        // Remove ref from inputProps since we'll pass it via NumberField's forwardRef
        const { ref: _, ...inputPropsWithoutRef } = params.inputProps

        return (
          <NumberField
            ref={combinedRef}
            {...params}
            label={label}
            name={name}
            fullWidth
            helperText={helperText}
            onFocus={(field) => {
              if (!readOnly) {
                field.target.select()
              }
            }}
            margin="dense"
            variant="standard"
            error={!!fieldState.error}
            size="small"
            onBlur={onBlur}
            InputProps={{
              ...params.InputProps,
              sx: {
                flexWrap: 'nowrap !important',
                '&::before': {
                  border: 'none !important',
                },
                '&::after': {
                  display: readOnly ? 'none' : undefined,
                },
                border: 'none !important',
              },
            }}
            inputProps={{
              ...inputPropsWithoutRef,
              className: css.approvalAmount,
            }}
            InputLabelProps={{
              ...params.InputLabelProps,
              shrink: true,
              sx: {
                color: (theme) => (readOnly ? `${theme.palette.text.secondary} !important` : undefined),
              },
            }}
          />
        )
      }}
    />
  )
}
