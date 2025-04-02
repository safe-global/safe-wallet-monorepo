import { useCallback, useState } from 'react'
import { InputAdornment, Stack, TextField, Typography, Alert } from '@mui/material'
import { MODALS_EVENTS, trackEvent } from '@/services/analytics'

const MAX_NOTE_LENGTH = 60

export const TxNoteInput = ({ onChange }: { onChange: (note: string) => void }) => {
  const [note, setNote] = useState('')
  const [isDirty, setIsDirty] = useState(false)

  const onInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setIsDirty(isDirty || e.target.value !== note)
      setNote(e.target.value)
    },
    [isDirty, note],
  )

  const onInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value.slice(0, MAX_NOTE_LENGTH))
    },
    [onChange],
  )

  const onFocus = useCallback(() => {
    setIsDirty(false)
  }, [])

  const onBlur = useCallback(() => {
    if (isDirty) {
      // Track the event only if the note is dirty
      // This prevents tracking the event when the user focuses and blurs the input without changing the note
      trackEvent(MODALS_EVENTS.SUBMIT_TX_NOTE)
    }
  }, [isDirty])

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
        name="note"
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
        onInput={onInput}
        onChange={onInputChange}
        onFocus={onFocus}
        onBlur={onBlur}
      />
    </>
  )
}
