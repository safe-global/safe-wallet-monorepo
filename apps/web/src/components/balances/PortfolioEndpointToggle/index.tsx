import type { ReactElement } from 'react'
import { Switch, FormControlLabel } from '@mui/material'
import { useAppDispatch, useAppSelector } from '@/store'
import { selectUsePortfolioEndpoint, setUsePortfolioEndpoint } from '@/store/settingsSlice'
import { trackEvent, ASSETS_EVENTS } from '@/services/analytics'

const PortfolioEndpointToggle = (): ReactElement => {
  const dispatch = useAppDispatch()
  const usePortfolioEndpoint = useAppSelector(selectUsePortfolioEndpoint)

  const handleToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.checked

    trackEvent({
      ...ASSETS_EVENTS.TOGGLE_PORTFOLIO_ENDPOINT,
      label: newValue ? 'Enabled' : 'Disabled',
    })

    dispatch(setUsePortfolioEndpoint(newValue))
  }

  return (
    <FormControlLabel
      control={<Switch checked={usePortfolioEndpoint} onChange={handleToggle} />}
      label="Use portfolio endpoint"
      labelPlacement="start"
      sx={{
        width: '100%',
        justifyContent: 'space-between',
        ml: 0,
      }}
    />
  )
}

export default PortfolioEndpointToggle
