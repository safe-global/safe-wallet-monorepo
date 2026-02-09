import { Alert, AlertTitle, Button, IconButton, Typography, Box } from '@mui/material'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import CloseIcon from '@mui/icons-material/Close'
import BookmarkAddIcon from '@mui/icons-material/BookmarkAdd'
import AddTrustedSafeDialog from './AddTrustedSafeDialog'
import type { SimilarAddressInfo } from '../../hooks/useNonPinnedSafeWarning.types'

interface NonPinnedWarningProps {
  safeAddress: string
  safeName?: string
  hasSimilarAddress: boolean
  similarAddresses: SimilarAddressInfo[]
  isConfirmDialogOpen: boolean
  onOpenConfirmDialog: () => void
  onCloseConfirmDialog: () => void
  onConfirmAdd: () => void
  onDismiss: () => void
}

/**
 * Warning banner displayed when user is viewing a non-pinned safe they own
 * Provides option to add the safe to their pinned list with confirmation dialog
 */
const NonPinnedWarning = ({
  safeAddress,
  safeName,
  hasSimilarAddress,
  similarAddresses,
  isConfirmDialogOpen,
  onOpenConfirmDialog,
  onCloseConfirmDialog,
  onConfirmAdd,
  onDismiss,
}: NonPinnedWarningProps) => {
  return (
    <>
      <Alert
        severity="warning"
        icon={<WarningAmberIcon />}
        data-testid="non-pinned-warning"
        action={
          <IconButton size="small" onClick={onDismiss} aria-label="dismiss">
            <CloseIcon fontSize="small" />
          </IconButton>
        }
        sx={{ mb: 2 }}
      >
        <AlertTitle>Untrusted Safe</AlertTitle>
        <Typography variant="body2" sx={{ mb: 1 }}>
          You are a signer of this Safe, but it is not yet included in your trusted list.
        </Typography>
        <Box>
          <Button
            variant="outlined"
            size="small"
            startIcon={<BookmarkAddIcon />}
            onClick={onOpenConfirmDialog}
            data-testid="add-to-pinned-list-button"
          >
            Add trusted Safe
          </Button>
        </Box>
      </Alert>

      <AddTrustedSafeDialog
        open={isConfirmDialogOpen}
        safeAddress={safeAddress}
        safeName={safeName}
        hasSimilarAddress={hasSimilarAddress}
        similarAddresses={similarAddresses}
        onConfirm={onConfirmAdd}
        onCancel={onCloseConfirmDialog}
      />
    </>
  )
}

export default NonPinnedWarning
