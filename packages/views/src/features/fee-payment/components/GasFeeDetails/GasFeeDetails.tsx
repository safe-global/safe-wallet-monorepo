import type { ReactElement } from 'react'
import { Lock, Pencil, RotateCcw } from 'lucide-react'
import { Button } from '@safe-global/views/components/ui/button'
import { Field, FieldError, FieldLabel } from '@safe-global/views/components/ui/field'
import { Input } from '@safe-global/views/components/ui/input'
import { Typography } from '@safe-global/views/components/ui/typography'

export type GasDetailRow = { label: string; value: string }

export type GasParamInput = {
  name: string
  label: string
  value: string
  error?: string
  onChange: (value: string) => void
}

export type GasParamsEditor = {
  fields: GasParamInput[]
  canSave: boolean
  onSave: () => void
  onCancel: () => void
  /** Shown only when the values differ from the estimate. */
  onReset?: () => void
}

export type GasFeeDetailsProps = {
  rows: GasDetailRow[]
  /** Why the values can't be changed; Edit is hidden when set. */
  readOnlyNote?: string
  onEdit?: () => void
  /** Replaces the rows with inputs while set. */
  editor?: GasParamsEditor
}

const DetailRows = ({ rows }: { rows: GasDetailRow[] }): ReactElement => (
  <div className="flex flex-col gap-1">
    {rows.map((row) => (
      <div key={row.label} className="flex items-center justify-between">
        <Typography variant="paragraph-small" color="muted">
          {row.label}
        </Typography>
        <Typography variant="paragraph-small">{row.value}</Typography>
      </div>
    ))}
  </div>
)

const Editor = ({ fields, canSave, onSave, onCancel, onReset }: GasParamsEditor): ReactElement => (
  <div className="flex flex-col gap-4" data-testid="gas-params-editor">
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

export const GasFeeDetails = ({ rows, readOnlyNote, onEdit, editor }: GasFeeDetailsProps): ReactElement => (
  <div className="flex flex-col gap-3 pt-1 pb-3" data-testid="gas-fee-details">
    {editor ? <Editor {...editor} /> : <DetailRows rows={rows} />}

    {!editor && readOnlyNote && (
      <div className="flex items-center gap-1.5">
        <Lock className="size-3.5 shrink-0 text-muted-foreground" />
        <Typography variant="paragraph-mini" color="muted">
          {readOnlyNote}
        </Typography>
      </div>
    )}

    {!editor && !readOnlyNote && onEdit && (
      <div>
        <Button variant="outline" size="xs" onClick={onEdit} data-testid="gas-params-edit">
          <Pencil />
          Edit gas settings
        </Button>
      </div>
    )}
  </div>
)
