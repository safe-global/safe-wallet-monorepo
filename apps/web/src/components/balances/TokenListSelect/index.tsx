import { useAppDispatch, useAppSelector } from '@/store'
import { selectSettings, setTokenList, TOKEN_LISTS } from '@/store/settingsSlice'
import type { SelectChangeEvent } from '@mui/material'
import { Box, SvgIcon, Tooltip, Typography, FormControl, InputLabel, Select, MenuItem } from '@mui/material'
import InfoIcon from '@/public/images/notifications/info.svg'
import ExternalLink from '@/components/common/ExternalLink'
import { OnboardingTooltip } from '@/components/common/OnboardingTooltip'
import Track from '@/components/common/Track'
import { ASSETS_EVENTS, trackEvent } from '@/services/analytics'
import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { HelpCenterArticle } from '@safe-global/utils/config/constants'

const LS_TOKENLIST_ONBOARDING = 'tokenlist_onboarding'

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
    <FormControl size="small">
      <InputLabel id="tokenlist-select-label">Token list</InputLabel>

      <OnboardingTooltip
        widgetLocalStorageId={LS_TOKENLIST_ONBOARDING}
        text={
          <>
            Spam filter on!
            <br />
            Switch to &quot;All tokens&quot; to see all of your tokens.
          </>
        }
      >
        <Select
          labelId="tokenlist-select-label"
          id="tokenlist-select"
          value={settings.tokenList}
          label="Tokenlist"
          onChange={handleSelectTokenList}
          renderValue={(value) => TokenListLabel[value]}
          onOpen={() => trackEvent(ASSETS_EVENTS.OPEN_TOKEN_LIST_MENU)}
          sx={{ minWidth: '152px' }}
        >
          <MenuItem value={TOKEN_LISTS.TRUSTED}>
            <Track {...ASSETS_EVENTS.SHOW_DEFAULT_TOKENS}>
              <Box display="flex" flexDirection="row" gap="4px" alignItems="center" minWidth={155}>
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
      </OnboardingTooltip>
    </FormControl>
  )
}

export default TokenListSelect
