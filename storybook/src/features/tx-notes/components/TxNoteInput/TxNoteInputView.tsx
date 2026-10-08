import type { ReactElement, ReactNode } from 'react'
import { Typography } from '@/components/ui/typography'
import { Field } from '@/components/ui/field'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import TxSectionTitle from '@/components/tx-flow/common/TxSectionTitle'

export type TxNoteField = {
  name: string
  value: string
  onChange: (value: string) => void
  onFocus: () => void
  onBlur: () => void
}

export type TxNoteInputViewProps = {
  noteLength: number
  maxLength: number
  renderController: (renderField: (field: TxNoteField) => ReactElement) => ReactNode
}

export function TxNoteInputView({ noteLength, maxLength, renderController }: TxNoteInputViewProps) {
  return (
    <div className="flex flex-col gap-2">
      <TxSectionTitle>Note</TxSectionTitle>

      {renderController((field) => (
        <Field>
          <InputGroup inputSize="hero" data-testid="tx-note-textfield">
            <InputGroupInput
              name={field.name}
              id="tx-note-input"
              aria-label="Note"
              placeholder="Optional"
              value={field.value}
              maxLength={maxLength}
              onChange={(e) => field.onChange(e.target.value)}
              onFocus={field.onFocus}
              onBlur={field.onBlur}
            />
            <InputGroupAddon align="inline-end">
              <Typography variant="paragraph-mini">
                {noteLength}/{maxLength}
              </Typography>
            </InputGroupAddon>
          </InputGroup>
        </Field>
      ))}

      <Typography data-testid="tx-note-alert" variant="paragraph-small" color="muted">
        Notes are publicly visible. Do not share any private or sensitive details.
      </Typography>
    </div>
  )
}
