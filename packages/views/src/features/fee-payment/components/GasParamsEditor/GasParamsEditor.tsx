import type { ReactElement } from 'react'
import { RotateCcw } from 'lucide-react'
import { Button } from '@safe-global/views/components/ui/button'
import { Field, FieldError, FieldLabel } from '@safe-global/views/components/ui/field'
import { Input } from '@safe-global/views/components/ui/input'

export type GasParamInput = {
  name: string
  label: string
  value: string
  error?: string
  autoFocus?: boolean
  onChange: (value: string) => void
}

export type GasParamsEditorProps = {
  fields: GasParamInput[]
  canSave: boolean
  onSave: () => void
  onCancel: () => void
  /** Shown only when the values differ from the estimate. */
  onReset?: () => void
}

export const GasParamsEditor = ({ fields, canSave, onSave, onCancel, onReset }: GasParamsEditorProps): ReactElement => (
  <div className="flex flex-col gap-4 pt-1 pb-3" data-testid="gas-params-editor">
    <div className="grid grid-cols-2 gap-3">
      {fields.map((field) => (
        <Field key={field.name} data-invalid={!!field.error} className="gap-1.5">
          <FieldLabel htmlFor={`gas-param-${field.name}`}>{field.label}</FieldLabel>
          <Input
            id={`gas-param-${field.name}`}
            inputSize="sm"
            variant="surface"
            inputMode="decimal"
            value={field.value}
            autoFocus={field.autoFocus}
            aria-invalid={!!field.error}
            onChange={(e) => field.onChange(e.target.value)}
          />
          {field.error && <FieldError>{field.error}</FieldError>}
        </Field>
      ))}
    </div>
    <div className="flex items-center gap-2">
      {onReset && (
        <Button variant="ghost-muted" size="xs" onClick={onReset}>
          <RotateCcw />
          Reset to estimate
        </Button>
      )}
      <div className="ml-auto flex gap-2">
        <Button variant="outline" size="xs" onClick={onCancel}>
          Cancel
        </Button>
        <Button size="xs" onClick={onSave} disabled={!canSave}>
          Save
        </Button>
      </div>
    </div>
  </div>
)
