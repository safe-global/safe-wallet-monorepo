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
        return (
          <NumberField
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
            inputRef={ref}
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
              ...params.inputProps,
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
