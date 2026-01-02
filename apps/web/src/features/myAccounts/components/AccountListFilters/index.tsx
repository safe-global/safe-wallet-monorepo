import { useAppDispatch, useAppSelector } from '@/store'
import { type OrderByOption, selectOrderByPreference, setOrderByPreference } from '@/store/orderByPreferenceSlice'
import debounce from 'lodash/debounce'
import { type Dispatch, type SetStateAction, useCallback, useState } from 'react'
import OrderByButton from '@/features/myAccounts/components/OrderByButton'
import css from '@/features/myAccounts/styles.module.css'
import SearchIcon from '@/public/images/common/search.svg'
import { Box, IconButton, InputAdornment, Paper, SvgIcon, TextField } from '@mui/material'
import ClearIcon from '@mui/icons-material/Clear'

type AccountListFiltersProps = {
  setSearchQuery: Dispatch<SetStateAction<string>>
  showClearButton?: boolean
}

const AccountListFilters = ({ setSearchQuery, showClearButton = true }: AccountListFiltersProps) => {
  const dispatch = useAppDispatch()
  const { orderBy } = useAppSelector(selectOrderByPreference)
  const [internalValue, setInternalValue] = useState('')

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleSearch = useCallback(debounce(setSearchQuery, 300), [])

  const handleOrderByChange = (orderBy: OrderByOption) => {
    dispatch(setOrderByPreference({ orderBy }))
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInternalValue(e.target.value)
    handleSearch(e.target.value)
  }

  const handleClear = () => {
    setInternalValue('')
    setSearchQuery('')
  }

  return (
    <Paper sx={{ px: 2, py: 1 }}>
      <Box display="flex" justifyContent="space-between" width="100%" gap={1}>
        <TextField
          id="search-by-name"
          placeholder="Search by name, ENS, address, or chain"
          aria-label="Search Safe list by name"
          variant="filled"
          hiddenLabel
          value={internalValue}
          onChange={handleChange}
          className={css.search}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SvgIcon
                  component={SearchIcon}
                  inheritViewBox
                  fontWeight="bold"
                  fontSize="small"
                  sx={{
                    color: 'var(--color-border-main)',
                    '.MuiInputBase-root.Mui-focused &': { color: 'var(--color-text-primary)' },
                  }}
                />
              </InputAdornment>
            ),
            endAdornment:
              showClearButton && internalValue ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={handleClear} edge="end">
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : null,
            disableUnderline: true,
          }}
          fullWidth
          size="small"
        />
        <OrderByButton orderBy={orderBy} onOrderByChange={handleOrderByChange} />
      </Box>
    </Paper>
  )
}

export default AccountListFilters
