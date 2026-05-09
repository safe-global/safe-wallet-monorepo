import { Chip, Tooltip } from '@mui/material'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'

const TOOLTIP_TEXT =
  'This address looks similar to another address in your list. Attackers create lookalike addresses to trick you. Verify the full address before selecting.'

/**
 * Warning chip for addresses that are similar to others in the list
 * Shows a neutral "Similar address" label - we don't assess risk level
 * since any similarity could be an attack
 */
const SimilarityWarning = () => {
  return (
    <Tooltip title={TOOLTIP_TEXT} arrow>
      <Chip
        icon={<WarningAmberIcon sx={{ fontSize: '16px !important', ml: 0.5 }} />}
        label="High similarity"
        size="small"
        color="warning"
        variant="outlined"
        data-testid="similarity-warning"
        sx={{ cursor: 'help', pl: 0.5 }}
      />
    </Tooltip>
  )
}

export default SimilarityWarning
