import Autocomplete from '@mui/material/Autocomplete'
import { type SyntheticEvent, useCallback, useMemo } from 'react'
import TextFieldInput from './TextFieldInput'

interface SelectItem {
  id: string
  label: string
  iconUrl?: string
  subLabel?: string
}

type SelectContractFieldTypes = {
  options: SelectItem[]
  onChange: (id: string) => void
  value: string
  label: string
  name: string
  id: string
}

const SelectContractField = ({ value, onChange, options, label, name, id }: SelectContractFieldTypes) => {
  const selectedValue = useMemo(() => options.find((opt) => opt.id === value), [options, value])

  const onValueChange = useCallback(
    (e: SyntheticEvent, value: SelectItem | null) => {
      if (value) {
        onChange(value.id)
      }
    },
    [onChange],
  )

  return (
    <Autocomplete
      disablePortal
      id={id}
      options={options}
      value={selectedValue}
      onChange={onValueChange}
      disabled={options.length === 1}
      renderInput={(params) => (
        <TextFieldInput
          {...params}
          label={label}
          name={name}
          InputProps={{
            ...params.InputProps,
            id: `${id}-input`,
          }}
        />
      )}
    />
  )
}

export default SelectContractField
