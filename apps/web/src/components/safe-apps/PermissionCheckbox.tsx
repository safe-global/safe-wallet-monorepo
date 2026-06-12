import { Checkbox } from '@/components/ui/checkbox'
import { Field, FieldLabel } from '@/components/ui/field'

type PermissionsCheckboxProps = {
  label: string
  name: string
  checked: boolean
  onChange: (event: React.ChangeEvent<HTMLInputElement>, checked: boolean) => void
}

const PermissionsCheckbox = ({ label, checked, onChange, name }: PermissionsCheckboxProps): React.ReactElement => (
  <Field orientation="horizontal" className="flex-1">
    <Checkbox
      id={name}
      name={name}
      checked={checked}
      onCheckedChange={(value) => onChange({} as React.ChangeEvent<HTMLInputElement>, value)}
    />
    <FieldLabel htmlFor={name} className="font-normal">
      {label}
    </FieldLabel>
  </Field>
)

export default PermissionsCheckbox
