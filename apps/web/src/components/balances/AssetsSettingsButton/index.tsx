import { useState, useCallback, type ReactElement } from 'react'
import { IconButton, SvgIcon } from '@mui/material'
import SettingsIcon from '@/public/images/sidebar/settings.svg'
import AssetsSettingsPopover from '../AssetsSettingsModal'
import Track from '@/components/common/Track'
import { ASSETS_EVENTS } from '@/services/analytics'

interface AssetsSettingsButtonProps {
  showHiddenAssets?: boolean
  toggleShowHiddenAssets?: () => void
}

const AssetsSettingsButton = ({
  showHiddenAssets,
  toggleShowHiddenAssets,
}: AssetsSettingsButtonProps): ReactElement => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)

  const handleClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
  }, [])

  const handleClose = useCallback(() => {
    setAnchorEl(null)
  }, [])

  return (
    <>
      <Track {...ASSETS_EVENTS.OPEN_SETTINGS_MODAL}>
        <IconButton
          onClick={handleClick}
          data-testid="assets-settings-btn"
          sx={{
            border: '1px solid',
            borderColor: 'border.light',
            borderRadius: 1,
            height: 40,
            width: 40,
            '&:hover': {
              backgroundColor: 'background.paper',
              borderColor: 'primary.main',
            },
          }}
        >
          <SvgIcon component={SettingsIcon} inheritViewBox fontSize="small" />
        </IconButton>
      </Track>

      <AssetsSettingsPopover
        anchorEl={anchorEl}
        onClose={handleClose}
        showHiddenAssets={showHiddenAssets}
        toggleShowHiddenAssets={toggleShowHiddenAssets}
      />
    </>
  )
}

export default AssetsSettingsButton
