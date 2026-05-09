import { ReactElement } from 'react'
import AddressInput from './AddressInput'

interface AddressContractFieldProps {
  id: string
  name: string
  value: string
  onChange: (value: string) => void
  label: string
  error?: string
  getAddressFromDomain?: (name: string) => Promise<string>
  networkPrefix?: string
  onBlur?: () => void
}

const AddressContractField = ({
  id,
  name,
  value,
  onChange,
  label,
  error,
  getAddressFromDomain,
  networkPrefix,
  onBlur,
}: AddressContractFieldProps): ReactElement => {
  return (
    <AddressInput
      id={id}
      name={name}
      label={label}
      address={value}
      inputProps={{ value }}
      onBlur={onBlur}
      showNetworkPrefix={!!networkPrefix}
      networkPrefix={networkPrefix}
      hiddenLabel={false}
      fullWidth
      error={error}
      getAddressFromDomain={getAddressFromDomain}
      onChangeAddress={onChange}
      showErrorsInTheLabel={false}
    />
  )
}

export default AddressContractField
