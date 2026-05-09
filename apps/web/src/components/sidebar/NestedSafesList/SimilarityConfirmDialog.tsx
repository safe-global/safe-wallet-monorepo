import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box } from '@mui/material'
import type { ReactElement } from 'react'
import EthHashInfo from '@/components/common/EthHashInfo'
import useChainId from '@/hooks/useChainId'

interface SimilarityConfirmDialogProps {
  address: string
  similarAddresses: string[]
  onConfirm: () => void
  onCancel: () => void
}

/**
 * Confirmation dialog shown when a user tries to select an address
 * that has been flagged for similarity to another address.
 */
export function SimilarityConfirmDialog({
  address,
  similarAddresses,
  onConfirm,
  onCancel,
}: SimilarityConfirmDialogProps): ReactElement {
  const chainId = useChainId()

  return (
    <Dialog open onClose={onCancel} maxWidth="sm" fullWidth data-testid="similarity-confirm-dialog">
      <DialogTitle sx={{ fontWeight: 'bold' }}>Similar address detected</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          This address looks similar to other addresses in your list. This could be a sign of an address poisoning
          attack where attackers create addresses that visually resemble legitimate ones.
        </Typography>

        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
            Selected address:
          </Typography>
          <EthHashInfo address={address} chainId={chainId} showCopyButton hasExplorer shortAddress={false} />
        </Box>

        {similarAddresses.length > 0 && (
          <Box>
            <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
              Similar {similarAddresses.length === 1 ? 'address' : 'addresses'}:
            </Typography>
            {similarAddresses.map((addr) => (
              <Box key={addr} sx={{ mb: 1 }}>
                <EthHashInfo address={addr} chainId={chainId} showCopyButton hasExplorer shortAddress={false} />
              </Box>
            ))}
          </Box>
        )}

        <Typography variant="body2" color="warning.main" sx={{ mt: 2, fontWeight: 500 }}>
          Please verify this is the correct address before proceeding.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ p: 2, pt: 0 }}>
        <Button variant="outlined" onClick={onCancel} data-testid="similarity-cancel-button">
          Cancel
        </Button>
        <Button variant="contained" color="primary" onClick={onConfirm} data-testid="similarity-confirm-button">
          I understand, proceed
        </Button>
      </DialogActions>
    </Dialog>
  )
}
