import { useCallback, useState } from 'react'
import { InputAdornment, Stack, TextField, Typography, Alert } from '@mui/material'

const MAX_NOTE_LENGTH = 60

export const TxNoteInput = ({ onChange }: { onChange: (note: string) => void }) => {
  const [note, setNote] = useState('')

  const onInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setNote(e.target.value)
  }, [])

  const onInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value.slice(0, MAX_NOTE_LENGTH))
    },
    [onChange],
  )

  return (
    <>
      <Stack direction="row" alignItems="flex-end" gap={1}>
        <Typography variant="h5">Optional note</Typography>
        <Typography variant="body2" color="text.secondary">
          Experimental
        </Typography>
      </Stack>

      <Alert severity="info">
        The notes are <b>publicly visible</b>, do not share any private or sensitive details.
      </Alert>

      <TextField
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
      />
    </>
  )
}
