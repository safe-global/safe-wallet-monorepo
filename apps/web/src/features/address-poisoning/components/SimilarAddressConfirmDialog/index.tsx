import { useState, type ReactElement } from 'react'
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Typography,
} from '@mui/material'
import { normalizeAddress } from '@safe-global/utils/utils/addressSimilarity'
import type { SimilarityMatch } from '@safe-global/utils/utils/addressSimilarity.types'

/**
 * Renders a full-length address with the characters that DIFFER from `other`
 * highlighted, so the user is forced to confront the actual divergence rather
 * than the lookalike head/tail. `address` and `other` are normalized hex.
 */
const DiffAddress = ({ address, other, label }: { address: string; other: string; label: string }): ReactElement => (
  <Box mb={1.5}>
    <Typography variant="caption" color="text.secondary">
      {label}
    </Typography>
    <Box fontFamily="monospace" sx={{ wordBreak: 'break-all', fontSize: 14 }}>
      0x
      {address.split('').map((char, index) => {
        const differs = char !== other[index]
        return (
          <Box
            component="span"
            key={index}
            {...(differs ? { 'data-testid': 'diff-char' } : {})}
            sx={{ color: differs ? 'error.dark' : 'text.primary', fontWeight: differs ? 700 : 400 }}
          >
            {char}
          </Box>
        )
      })}
    </Box>
  </Box>
)

/**
 * Acknowledge-to-proceed gate for a CRITICAL address-poisoning lookalike. Shows the
 * candidate and the trusted anchor it resembles at full length, with the differing
 * characters highlighted, and requires an explicit acknowledgement before proceeding.
 */
const SimilarAddressConfirmDialog = ({
  open,
  candidate,
  match,
  anchorName,
  onConfirm,
  onCancel,
}: {
  open: boolean
  candidate: string
  match: SimilarityMatch
  anchorName?: string
  onConfirm: () => void
  onCancel: () => void
}): ReactElement => {
  const [acknowledged, setAcknowledged] = useState(false)
  const candidateHex = normalizeAddress(candidate)
  const anchorHex = match.anchor

  return (
    <Dialog open={open} onClose={onCancel} maxWidth="sm" fullWidth data-testid="similar-address-confirm-dialog">
      <DialogTitle>Double-check this address</DialogTitle>
      <DialogContent>
        <Typography variant="body2" mb={2}>
          This address closely resembles {anchorName ? `"${anchorName}"` : 'an address'} you trust, but it is not the
          same. Address-poisoning scams rely on matching only the first and last characters. Compare them below — the
          highlighted characters are different.
        </Typography>
        <DiffAddress label="The address you entered" address={candidateHex} other={anchorHex} />
        <DiffAddress label="The trusted address it resembles" address={anchorHex} other={candidateHex} />
        <FormControlLabel
          control={
            <Checkbox
              checked={acknowledged}
              onChange={(event) => setAcknowledged(event.target.checked)}
              data-testid="ack-checkbox"
            />
          }
          label="I've compared the full addresses and this is the one I intend to use"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} data-testid="confirm-cancel">
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          disabled={!acknowledged}
          color="error"
          variant="contained"
          data-testid="confirm-proceed"
          sx={{ bgcolor: 'error.dark', '&:hover': { bgcolor: 'error.dark' } }}
        >
          Proceed anyway
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default SimilarAddressConfirmDialog
