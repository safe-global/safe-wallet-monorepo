import type { ReactElement } from 'react'
import { Box, Popover, Typography } from '@mui/material'
import TokenListSelect from '../TokenListSelect'
import ProviderSelect from '../ProviderSelect'
import HiddenTokenButton from '../HiddenTokenButton'

interface AssetsSettingsPopoverProps {
  anchorEl: HTMLElement | null
  onClose: () => void
  showHiddenAssets?: boolean
  toggleShowHiddenAssets?: () => void
}

const AssetsSettingsPopover = ({
  anchorEl,
  onClose,
  showHiddenAssets,
  toggleShowHiddenAssets,
}: AssetsSettingsPopoverProps): ReactElement => {
  return (
    <Popover
      open={!!anchorEl}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'left',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'left',
      }}
      slotProps={{
        paper: {
          sx: {
            minWidth: { xs: 280, sm: 320 },
            maxWidth: 400,
            mt: 1,
          },
        },
      }}
      disableRestoreFocus
    >
      <Box p={2.5}>
        <Box mb={2.5}>
          <Typography variant="overline" color="text.secondary" display="block" mb={1} fontSize="0.75rem">
            Token Filter
          </Typography>
          <TokenListSelect />
        </Box>

        <Box mb={2.5}>
          <Typography variant="overline" color="text.secondary" display="block" mb={1} fontSize="0.75rem">
            Data Provider
          </Typography>
          <ProviderSelect />
        </Box>

        {showHiddenAssets !== undefined && toggleShowHiddenAssets && (
          <Box>
            <Typography variant="overline" color="text.secondary" display="block" mb={1} fontSize="0.75rem">
              Hidden Tokens
            </Typography>
            <HiddenTokenButton showHiddenAssets={showHiddenAssets} toggleShowHiddenAssets={toggleShowHiddenAssets} />
          </Box>
        )}
      </Box>
    </Popover>
  )
}

export default AssetsSettingsPopover
