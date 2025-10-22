import type { ReactElement } from 'react'
import { Switch, FormControlLabel } from '@mui/material'
import { useAppDispatch, useAppSelector } from '@/store'
import { selectExcludeDustTokens, setExcludeDustTokens } from '@/store/settingsSlice'
import { trackEvent, ASSETS_EVENTS } from '@/services/analytics'

const DustTokenToggle = (): ReactElement => {
  const dispatch = useAppDispatch()
  const excludeDustTokens = useAppSelector(selectExcludeDustTokens)

  const handleToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.checked

    trackEvent({
      ...ASSETS_EVENTS.TOGGLE_DUST_TOKENS,
      label: newValue ? 'Enabled' : 'Disabled',
    })

    dispatch(setExcludeDustTokens(newValue))
  }

  return (
    <FormControlLabel
      control={<Switch checked={excludeDustTokens} onChange={handleToggle} />}
      label="Hide dust tokens"
      labelPlacement="start"
      sx={{
        width: '100%',
        justifyContent: 'space-between',
        ml: 0,
      }}
    />
  )
}

export default DustTokenToggle
