import EthHashInfo from '@/components/common/EthHashInfo'
import { SignerSelectorView } from '@views/components/common/SignerSelector/SignerSelectorView'

export type SignerSelectorProps = {
  options: string[]
  value: string | undefined
  onChange: (address: string) => void
  label?: string
  isOptionDisabled?: (address: string) => boolean
  disabledReason?: (address: string) => string
}

const SignerSelector = ({ options, value, onChange, label, isOptionDisabled, disabledReason }: SignerSelectorProps) => {
  return (
    <SignerSelectorView
      options={options.map((owner) => {
        const disabled = isOptionDisabled?.(owner) ?? false
        return { address: owner, disabled, disabledReason: disabled ? disabledReason?.(owner) : undefined }
      })}
      value={value}
      onChange={onChange}
      label={label}
      renderAddress={(props) => <EthHashInfo {...props} />}
    />
  )
}

export default SignerSelector
