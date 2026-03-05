import { useCallback } from 'react'
import { InputAdornment, Stack, TextField, Typography } from '@mui/material'
import { MODALS_EVENTS, trackEvent } from '@/services/analytics'
import { Controller, useForm } from 'react-hook-form'

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
    <Stack gap={1}>
      <Stack direction="row" alignItems="flex-end" gap={1}>
        <Typography variant="h5">Note</Typography>
      </Stack>

      <Controller
        name="note"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            data-testid="tx-note-textfield"
            label="Optional"
            fullWidth
            value={field.value || ''}
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
            slotProps={{
              htmlInput: { maxLength: MAX_NOTE_LENGTH },
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <Typography variant="caption" mt={3}>
                      {note.length}/{MAX_NOTE_LENGTH}
                    </Typography>
                  </InputAdornment>
                ),
              },
            }}
          />
        )}
      />

      <Typography data-testid="tx-note-alert" variant="body2" color="text.secondary">
        Notes are publicly visible. Do not share any private or sensitive details.
      </Typography>
    </Stack>
  )
}
