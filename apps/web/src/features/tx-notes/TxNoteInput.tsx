import { useCallback } from 'react'
import { InputAdornment, Stack, TextField, Typography, Alert } from '@mui/material'
import { MODALS_EVENTS, trackEvent } from '@/services/analytics'
import { useForm } from 'react-hook-form'

const MAX_NOTE_LENGTH = 60

export const TxNoteInput = ({ onChange }: { onChange: (note: string) => void }) => {
  const {
    register,
    watch,
    reset,
    formState: { isDirty },
  } = useForm<{ note: string }>()

  const note = watch('note') || ''

  const onInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value.slice(0, MAX_NOTE_LENGTH))
    },
    [onChange],
  )

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
    <>
      <Stack direction="row" alignItems="flex-end" gap={1}>
        <Typography variant="h5">Optional note</Typography>
        <Typography variant="body2" color="text.secondary">
          Experimental
        </Typography>
      </Stack>

      <Alert data-testid="tx-note-alert" severity="info">
        The notes are <b>publicly visible</b>, do not share any private or sensitive details.
      </Alert>

      <TextField
        data-testid="tx-note-textfield"
        label="Note"
        fullWidth
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
        {...register('note')}
        onInput={onInput}
        onBlur={onBlur}
        onFocus={onFocus}
      />
    </>
  )
}
