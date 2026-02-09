import { Alert, AlertTitle, Button, Box } from '@mui/material'

interface MigrationPromptProps {
  /** Callback when user wants to proceed with selecting safes */
  onProceed: () => void
}

/**
 * Migration prompt displayed to existing users who have safes but none pinned
 * Explains the new pinned-only security feature and guides them to select trusted safes
 */
const MigrationPrompt = ({ onProceed }: MigrationPromptProps) => {
  return (
    <Alert severity="info" data-testid="migration-prompt" sx={{ mb: 2 }}>
      <AlertTitle>Confirm your trusted Safes</AlertTitle>
      Only trusted Safes will appear in your account list.
      <Box sx={{ mt: 2 }}>
        <Button variant="contained" size="small" onClick={onProceed} data-testid="select-safes-button">
          Add
        </Button>
      </Box>
    </Alert>
  )
}

export default MigrationPrompt
