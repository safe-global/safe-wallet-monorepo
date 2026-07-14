import { useId } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Field, FieldLabel } from '@/components/ui/field'

type PermissionsCheckboxProps = {
  label: string
  name: string
  checked: boolean
  onChange: (event: React.ChangeEvent<HTMLInputElement>, checked: boolean) => void
}

const PermissionsCheckbox = ({ label, checked, onChange, name }: PermissionsCheckboxProps): React.ReactElement => {
  // Unique id so each checkbox associates with its own label (callers may reuse `name`),
  // which gives it an accessible name equal to `label`.
  const id = useId()

  return (
    <Field orientation="horizontal" className="flex-1">
      <Checkbox
        id={id}
        name={name}
        // base-ui puts `id` on the hidden input, so the visible role="checkbox" needs an
        // explicit accessible name (the htmlFor label only names the hidden input).
        aria-label={label}
        checked={checked}
        onCheckedChange={(value) => onChange({} as React.ChangeEvent<HTMLInputElement>, value)}
      />
      <FieldLabel htmlFor={id} className="font-normal">
        {label}
      </FieldLabel>
    </Field>
  )
}

export default PermissionsCheckbox
