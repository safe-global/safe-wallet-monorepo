import { useAppDispatch, useAppSelector } from '@/store'
import { selectSettings, setTokenList, TOKEN_LISTS } from '@/store/settingsSlice'
import type { SelectChangeEvent } from '@mui/material'
import { Box, SvgIcon, Tooltip, Typography, Select, MenuItem } from '@mui/material'
import InfoIcon from '@/public/images/notifications/info.svg'
import ExternalLink from '@/components/common/ExternalLink'
import Track from '@/components/common/Track'
import { ASSETS_EVENTS, trackEvent } from '@/services/analytics'
import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { HelpCenterArticle } from '@safe-global/utils/config/constants'

const TokenListLabel = {
  [TOKEN_LISTS.TRUSTED]: 'Default tokens',
  [TOKEN_LISTS.ALL]: 'All tokens',
}

const TokenListSelect = () => {
  const dispatch = useAppDispatch()
  const settings = useAppSelector(selectSettings)
  const hasDefaultTokenlist = useHasFeature(FEATURES.DEFAULT_TOKENLIST)

  const handleSelectTokenList = (event: SelectChangeEvent<TOKEN_LISTS>) => {
    const selectedString = event.target.value as TOKEN_LISTS
    dispatch(setTokenList(selectedString))
  }

  if (!hasDefaultTokenlist) {
    return null
  }

  return (
    <Select
      id="tokenlist-select"
      value={settings.tokenList}
      onChange={handleSelectTokenList}
      renderValue={(value) => TokenListLabel[value]}
      onOpen={() => trackEvent(ASSETS_EVENTS.OPEN_TOKEN_LIST_MENU)}
      fullWidth
      size="small"
    >
      <MenuItem value={TOKEN_LISTS.TRUSTED}>
        <Track {...ASSETS_EVENTS.SHOW_DEFAULT_TOKENS}>
          <Box display="flex" flexDirection="row" gap="4px" alignItems="center" width="100%">
            {TokenListLabel.TRUSTED}
            <Tooltip
              arrow
              title={
                <Typography>
                  Learn more about <ExternalLink href={HelpCenterArticle.SPAM_TOKENS}>default tokens</ExternalLink>
                </Typography>
              }
            >
              <span>
                <SvgIcon sx={{ display: 'block' }} color="border" fontSize="small" component={InfoIcon} />
              </span>
            </Tooltip>
          </Box>
        </Track>
      </MenuItem>

      <MenuItem value={TOKEN_LISTS.ALL}>
        <Track {...ASSETS_EVENTS.SHOW_ALL_TOKENS}>
          <span>{TokenListLabel.ALL}</span>
        </Track>
      </MenuItem>
    </Select>
  )
}

export default TokenListSelect
