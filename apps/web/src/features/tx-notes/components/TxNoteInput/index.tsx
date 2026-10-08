import { useCallback } from 'react'
import { MODALS_EVENTS, trackEvent } from '@/services/analytics'
import { Controller, useForm } from 'react-hook-form'
import { TxNoteInputView } from '@views/features/tx-notes/components/TxNoteInput/TxNoteInputView'

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
    <TxNoteInputView
      noteLength={note.length}
      maxLength={MAX_NOTE_LENGTH}
      renderController={(renderField) => (
        <Controller
          name="note"
          control={control}
          render={({ field }) =>
            renderField({
              name: field.name,
              value: field.value || '',
              onChange: (value) => {
                const limitedValue = value.slice(0, MAX_NOTE_LENGTH)
                field.onChange(limitedValue)
                onChange(limitedValue)
              },
              onFocus,
              onBlur: () => {
                field.onBlur()
                onBlur()
              },
            })
          }
        />
      )}
    />
  )
}
