import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Alert, Typography, Box } from '@mui/material'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import EthHashInfo from '@/components/common/EthHashInfo'
import type { SimilarAddressInfo } from '../../hooks/useNonPinnedSafeWarning.types'
import ExternalLink from '@/components/common/ExternalLink'
import { HelpCenterArticle } from '@safe-global/utils/config/constants'

interface AddTrustedSafeDialogProps {
  open: boolean
  safeAddress: string
  safeName?: string
  hasSimilarAddress: boolean
  similarAddresses: SimilarAddressInfo[]
  onConfirm: () => void
  onCancel: () => void
}

/**
 * Confirmation dialog for adding a safe to the trusted list
 * Shows enhanced warning if similar addresses are detected
 */
const AddTrustedSafeDialog = ({
  open,
  safeAddress,
  safeName,
  hasSimilarAddress,
  similarAddresses,
  onConfirm,
  onCancel,
}: AddTrustedSafeDialogProps) => {
  return (
    <Dialog open={open} onClose={onCancel} maxWidth="sm" fullWidth data-testid="add-trusted-safe-dialog">
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>Confirm trusted Safe</DialogTitle>

      <DialogContent>
        {hasSimilarAddress && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body2" fontWeight="bold" gutterBottom>
              Similar address detected
            </Typography>
            <Typography variant="body2">
              This address is similar to another Safe in your account. This could indicate an address poisoning attack.
              Compare the addresses carefully before proceeding.{' '}
            </Typography>
            <Typography variant="body2">
              <ExternalLink href={HelpCenterArticle.ADDRESS_POISONING} noIcon>
                Learn more about address poisoning
              </ExternalLink>
            </Typography>
          </Alert>
        )}

        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Safe to add
          </Typography>
          <Box
            sx={{
              p: 2,
              bgcolor: 'background.paper',
              borderRadius: 1,
              border: hasSimilarAddress ? '2px solid' : '1px solid',
              borderColor: 'border.light',
            }}
          >
            <EthHashInfo address={safeAddress} showCopyButton shortAddress={false} showAvatar avatarSize={32} />
            {safeName && (
              <Typography variant="body2" color="text.primary" sx={{ mt: 1 }}>
                Name: {safeName}
              </Typography>
            )}
          </Box>
        </Box>

        {hasSimilarAddress && similarAddresses.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Similar {similarAddresses.length === 1 ? 'Safe' : 'Safes'} in your account
            </Typography>
            {similarAddresses.map((similar) => (
              <Box
                key={similar.address}
                sx={{
                  p: 2,
                  mb: 1,
                  bgcolor: 'background.paper',
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'border.light',
                }}
              >
                <EthHashInfo address={similar.address} showCopyButton shortAddress={false} showAvatar avatarSize={32} />
                {similar.name && (
                  <Typography variant="body2" color="text.primary" sx={{ mt: 1 }}>
                    Name: {similar.name}
                  </Typography>
                )}
              </Box>
            ))}
          </Box>
        )}

        <Typography variant="body2" color="text.secondary">
          {hasSimilarAddress
            ? ''
            : 'Review the full address above. Continue only if you recognize this Safe and want to add it to your trusted list.'}
        </Typography>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onCancel} variant="text">
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          data-testid="confirm-add-trusted-safe-button"
          startIcon={hasSimilarAddress ? <WarningAmberIcon color="warning" /> : undefined}
        >
          {hasSimilarAddress ? 'I understand, add anyway' : 'Confirm'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default AddTrustedSafeDialog
