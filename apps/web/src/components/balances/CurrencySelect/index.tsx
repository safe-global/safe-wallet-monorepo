import type { ReactElement } from 'react'
import type { SelectChangeEvent } from '@mui/material'
import { FormControl, MenuItem, Select } from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { useAppDispatch, useAppSelector } from '@/store'
import { selectCurrency, setCurrency } from '@/store/settingsSlice'
import useCurrencies from './useCurrencies'
import { trackEvent, ASSETS_EVENTS } from '@/services/analytics'

const CurrencySelect = (): ReactElement => {
  const currency = useAppSelector(selectCurrency)
  const dispatch = useAppDispatch()
  const fiatCurrencies = useCurrencies() || [currency.toUpperCase()]

  const handleChange = (e: SelectChangeEvent<string>) => {
    const currency = e.target.value

    trackEvent({ ...ASSETS_EVENTS.CHANGE_CURRENCY, label: currency.toUpperCase() })

    dispatch(setCurrency(currency.toLowerCase()))
  }

  const handleTrack = (label: 'Open' | 'Close') => {
    trackEvent({ ...ASSETS_EVENTS.CURRENCY_MENU, label })
  }

  return (
    <FormControl size="small">
      <Select
        data-testid="currency-selector"
        labelId="currency-label"
        id="currency"
        value={currency.toUpperCase()}
        onChange={handleChange}
        onOpen={() => handleTrack('Open')}
        onClose={() => handleTrack('Close')}
        IconComponent={ExpandMoreIcon}
        MenuProps={{ PaperProps: { sx: { marginTop: '8px' } } }}
        sx={{
          height: '32px',
          backgroundColor: 'var(--color-background-main)',
          fontSize: '14px',
          fontWeight: '600',
          border: '1.5px solid var(--color-primary-main)',
          borderRadius: '6px',
          '& fieldset': {
            border: 'none',
          },
          '&:hover': {
            backgroundColor: '--variant-outlinedBg: rgba(18, 19, 18, 0.04);',
          },
          '&:hover fieldset': {
            border: 'none',
          },
          '&.Mui-focused': {
            borderColor: 'primary.main',
          },
          '&.Mui-focused fieldset': {
            border: 'none',
          },
          '& .MuiSelect-icon': { color: 'primary.main', right: '8px' },
          '& .MuiSelect-select': {
            paddingLeft: '12px',
            paddingRight: '32px !important',
            paddingY: '4px',
            color: 'primary.main',
          },
        }}
      >
        {fiatCurrencies.map((item) => (
          <MenuItem data-testid="currency-item" key={item} value={item} sx={{ overflow: 'hidden' }}>
            {item.toUpperCase()}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  )
}

export default CurrencySelect
