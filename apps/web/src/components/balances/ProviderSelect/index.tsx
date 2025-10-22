import { useAppDispatch, useAppSelector } from '@/store'
import { selectPortfolioProvider, setPortfolioProvider, PORTFOLIO_PROVIDERS } from '@/store/settingsSlice'
import type { SelectChangeEvent } from '@mui/material'
import { Box, SvgIcon, Tooltip, Typography, Select, MenuItem } from '@mui/material'
import InfoIcon from '@/public/images/notifications/info.svg'
import Track from '@/components/common/Track'
import { ASSETS_EVENTS, trackEvent } from '@/services/analytics'

const ProviderLabel = {
  [PORTFOLIO_PROVIDERS.AUTO]: 'Auto',
  [PORTFOLIO_PROVIDERS.ZERION]: 'Zerion',
  [PORTFOLIO_PROVIDERS.ZAPPER]: 'Zapper',
}

const ProviderSelect = () => {
  const dispatch = useAppDispatch()
  const portfolioProvider = useAppSelector(selectPortfolioProvider)

  const handleSelectProvider = (event: SelectChangeEvent<PORTFOLIO_PROVIDERS>) => {
    const selectedProvider = event.target.value as PORTFOLIO_PROVIDERS

    trackEvent({
      ...ASSETS_EVENTS.CHANGE_PROVIDER,
      label: selectedProvider,
    })

    dispatch(setPortfolioProvider(selectedProvider))
  }

  return (
    <Select
      id="provider-select"
      value={portfolioProvider}
      onChange={handleSelectProvider}
      renderValue={(value) => ProviderLabel[value]}
      onOpen={() => trackEvent(ASSETS_EVENTS.OPEN_PROVIDER_MENU)}
      fullWidth
      size="small"
    >
      <MenuItem value={PORTFOLIO_PROVIDERS.AUTO}>
        <Box display="flex" flexDirection="row" gap="4px" alignItems="center" width="100%">
          {ProviderLabel[PORTFOLIO_PROVIDERS.AUTO]}
          <Tooltip
            arrow
            title={<Typography variant="body2">Automatically selects the best available provider</Typography>}
          >
            <span>
              <SvgIcon sx={{ display: 'block' }} color="border" fontSize="small" component={InfoIcon} />
            </span>
          </Tooltip>
        </Box>
      </MenuItem>

      <MenuItem value={PORTFOLIO_PROVIDERS.ZERION}>
        <Track {...ASSETS_EVENTS.CHANGE_PROVIDER}>
          <span>{ProviderLabel[PORTFOLIO_PROVIDERS.ZERION]}</span>
        </Track>
      </MenuItem>

      <MenuItem value={PORTFOLIO_PROVIDERS.ZAPPER}>
        <Track {...ASSETS_EVENTS.CHANGE_PROVIDER}>
          <span>{ProviderLabel[PORTFOLIO_PROVIDERS.ZAPPER]}</span>
        </Track>
      </MenuItem>
    </Select>
  )
}

export default ProviderSelect
