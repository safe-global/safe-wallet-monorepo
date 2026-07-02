import { Alert, AlertTitle, Box, Button } from '@mui/material'

/**
 * Empty-state CTA shown when a wallet is connected but the user has not curated
 * any trusted (local) Safe accounts yet. Opens the "Manage trusted Safes" modal
 * via `onAdd`. Shared across the welcome Local accounts tab, the workspace Safe
 * accounts page, and the in-safe dropdown so the prompt is identical everywhere.
 */
const AddTrustedSafesCard = ({ onAdd }: { onAdd: () => void }) => {
  return (
    <Alert severity="info" data-testid="add-trusted-safes-card" sx={{ mb: 2 }}>
      <AlertTitle sx={{ fontWeight: 700 }}>Add trusted Safes</AlertTitle>
      Add the Safe accounts you want to track. Only Safes you trust will appear here.
      <Box sx={{ mt: 2 }}>
        <Button variant="contained" size="small" onClick={onAdd} data-testid="add-trusted-safes-button">
          Add Safes
        </Button>
      </Box>
    </Alert>
  )
}

export default AddTrustedSafesCard
