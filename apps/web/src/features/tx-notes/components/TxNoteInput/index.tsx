import { useCallback } from 'react'
import { MODALS_EVENTS, trackEvent } from '@/services/analytics'
import { Controller, useForm } from 'react-hook-form'
import { Typography } from '@/components/ui/typography'
import { Field, FieldLabel } from '@/components/ui/field'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'

const MAX_NOTE_LENGTH = 60

export default function TxNoteInput({ onChange }: { onChange: (note: string) => void }) {
  const {
    control,
    watch,
    reset,
    formState: { isDirty },
  } = useForm<{ note: string }>({
    defaultValues: { note: '' },
  })

  const note = watch('note') || ''

  const onFocus = useCallback(() => {
    // Reset the isDirty state when the user focuses on the input
    reset({ note })
  }, [reset, note])

  const onBlur = useCallback(() => {
    if (isDirty && note.length > 0) {
      // Track the event only if the note is dirty and not empty
      // This prevents tracking the event when the user focuses and blurs the input without changing the note
      trackEvent(MODALS_EVENTS.SUBMIT_TX_NOTE)
    }
  }, [isDirty, note])

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-row items-end gap-2">
        <Typography variant="h4">Note</Typography>
      </div>

      <Controller
        name="note"
        control={control}
        render={({ field }) => (
          <Field>
            <FieldLabel htmlFor="tx-note-input">Optional</FieldLabel>
            <InputGroup data-testid="tx-note-textfield">
              <InputGroupInput
                name={field.name}
                id="tx-note-input"
                value={field.value || ''}
                maxLength={MAX_NOTE_LENGTH}
                onChange={(e) => {
                  const limitedValue = e.target.value.slice(0, MAX_NOTE_LENGTH)
                  field.onChange(limitedValue)
                  onChange(limitedValue)
                }}
                onFocus={onFocus}
                onBlur={() => {
                  field.onBlur()
                  onBlur()
                }}
              />
              <InputGroupAddon align="inline-end">
                <Typography variant="paragraph-mini">
                  {note.length}/{MAX_NOTE_LENGTH}
                </Typography>
              </InputGroupAddon>
            </InputGroup>
          </Field>
        )}
      />

      <Typography data-testid="tx-note-alert" variant="paragraph-small" color="muted">
        Notes are publicly visible. Do not share any private or sensitive details.
      </Typography>
    </div>
  )
}
