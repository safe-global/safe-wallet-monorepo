import { Sticky } from '@/components/common/Sticky'
import Track from '@/components/common/Track'
import { ASSETS_EVENTS } from '@/services/analytics'
import { VisibilityOffOutlined } from '@mui/icons-material'
import { Box, Typography, Button } from '@mui/material'

import css from './styles.module.css'

const TokenMenu = ({
  saveChanges,
  cancel,
  selectedAssetCount,
  showHiddenAssets,
  deselectAll,
}: {
  saveChanges: () => void
  cancel: () => void
  deselectAll: () => void
  selectedAssetCount: number
  showHiddenAssets: boolean
}) => {
  return null

  return (
    <Sticky>
      <Box className={css.wrapper}>
        <Box className={css.hideTokensHeader}>
          <VisibilityOffOutlined />
          <Typography variant="body2" lineHeight="inherit">
            {selectedAssetCount} {selectedAssetCount === 1 ? 'token' : 'tokens'} selected
          </Typography>
        </Box>
        <Box display="flex" flexDirection="row" gap={1}>
          <Track {...ASSETS_EVENTS.CANCEL_HIDE_DIALOG}>
            <Button onClick={cancel} className={css.cancelButton} size="small" variant="outlined">
              Cancel
            </Button>
          </Track>
          <Track {...ASSETS_EVENTS.DESELECT_ALL_HIDE_DIALOG}>
            <Button onClick={deselectAll} className={css.cancelButton} size="small" variant="outlined">
              Deselect all
            </Button>
          </Track>
          <Track {...ASSETS_EVENTS.SAVE_HIDE_DIALOG}>
            <Button onClick={saveChanges} className={css.applyButton} size="small" variant="contained">
              Save
            </Button>
          </Track>
        </Box>
      </Box>
    </Sticky>
  )
}

export default TokenMenu
