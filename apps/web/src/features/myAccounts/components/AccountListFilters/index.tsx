import { useAppDispatch, useAppSelector } from '@/store'
import { type OrderByOption, selectOrderByPreference, setOrderByPreference } from '@/store/orderByPreferenceSlice'
import debounce from 'lodash/debounce'
import { type Dispatch, type SetStateAction, useCallback } from 'react'
import OrderByButton from '../OrderByButton'
import css from '../../styles.module.css'
import SearchIcon from '@/public/images/common/search.svg'
import { Box, InputAdornment, Paper, SvgIcon, TextField } from '@mui/material'

const AccountListFilters = ({ setSearchQuery }: { setSearchQuery: Dispatch<SetStateAction<string>> }) => {
  const dispatch = useAppDispatch()
  const { orderBy } = useAppSelector(selectOrderByPreference)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleSearch = useCallback(debounce(setSearchQuery, 300), [])

  const handleOrderByChange = (orderBy: OrderByOption) => {
    dispatch(setOrderByPreference({ orderBy }))
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
          onChange={(e) => {
            handleSearch(e.target.value)
          }}
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
