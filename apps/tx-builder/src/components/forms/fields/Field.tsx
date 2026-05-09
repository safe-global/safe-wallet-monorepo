import { Control, Controller, FieldValues, FieldPath, PathValue } from 'react-hook-form'

export interface SelectItem {
  id: string
  label: string
  iconUrl?: string
  subLabel?: string
}

import {
  BOOLEAN_FIELD_TYPE,
  CONTRACT_METHOD_FIELD_TYPE,
  CUSTOM_TRANSACTION_DATA_FIELD_TYPE,
  isAddressFieldType,
  isBooleanFieldType,
} from './fields'
import AddressContractField from './AddressContractField'
import SelectContractField from './SelectContractField'
import TextareaContractField from './TextareaContractField'
import TextContractField from './TextContractField'
import validateField, { ValidationFunction } from '../validations/validateField'

const CUSTOM_DEFAULT_VALUES: CustomDefaultValueTypes = {
  [BOOLEAN_FIELD_TYPE]: 'true',
  [CONTRACT_METHOD_FIELD_TYPE]: '0', // first contract method as default
}

const BOOLEAN_DEFAULT_OPTIONS: SelectItem[] = [
  { id: 'true', label: 'True' },
  { id: 'false', label: 'False' },
]

const DEFAULT_OPTIONS: DefaultOptionTypes = {
  [BOOLEAN_FIELD_TYPE]: BOOLEAN_DEFAULT_OPTIONS,
}

interface CustomDefaultValueTypes {
  [key: string]: string
}

interface DefaultOptionTypes {
  [key: string]: SelectItem[]
}

type FieldProps<T extends FieldValues = FieldValues> = {
  fieldType: string
  control: Control<T>
  id: string
  name: FieldPath<T> | string
  label: string
  fullWidth?: boolean
  required?: boolean
  validations?: ValidationFunction[]
  getAddressFromDomain?: (name: string) => Promise<string>
  networkPrefix?: string
  showErrorsInTheLabel?: boolean
  shouldUnregister?: boolean
  options?: SelectItem[]
}

const Field = <T extends FieldValues = FieldValues>({
  fieldType,
  control,
  name,
  shouldUnregister = true,
  options,
  required = true,
  validations,
  ...props
}: FieldProps<T>) => {
  const FieldComponent = getFieldComponent(fieldType)

  return (
    <Controller
      name={name as FieldPath<T>}
      control={control}
      defaultValue={(CUSTOM_DEFAULT_VALUES[fieldType] || '') as PathValue<T, FieldPath<T>>}
      shouldUnregister={shouldUnregister}
      rules={{
        required: {
          value: required,
          message: 'Required',
        },
        validate: validateField(fieldType, validations),
      }}
      render={({ field, fieldState }) => (
        <FieldComponent
          name={field.name}
          onChange={field.onChange}
          onBlur={field.onBlur}
          value={field.value}
          options={options || DEFAULT_OPTIONS[fieldType]}
          error={fieldState.error?.message}
          required={required}
          {...props}
        />
      )}
    />
  )
}

export default Field

interface FieldComponentBaseProps {
  name: string
  value: string
  onChange: (...event: unknown[]) => void
  onBlur?: () => void
  label: string
  error?: string
  required?: boolean
  options?: SelectItem[]
  id: string
  fullWidth?: boolean
  getAddressFromDomain?: (name: string) => Promise<string>
  networkPrefix?: string
  showErrorsInTheLabel?: boolean
}

const getFieldComponent = (fieldType: string): React.FC<FieldComponentBaseProps> => {
  if (isAddressFieldType(fieldType)) {
    return AddressContractField as unknown as React.FC<FieldComponentBaseProps>
  }

  if (isBooleanFieldType(fieldType)) {
    return SelectContractField as unknown as React.FC<FieldComponentBaseProps>
  }

  if (fieldType === CONTRACT_METHOD_FIELD_TYPE) {
    return SelectContractField as unknown as React.FC<FieldComponentBaseProps>
  }

  if (fieldType === CUSTOM_TRANSACTION_DATA_FIELD_TYPE) {
    return TextareaContractField as unknown as React.FC<FieldComponentBaseProps>
  }

  return TextContractField as unknown as React.FC<FieldComponentBaseProps>
}
