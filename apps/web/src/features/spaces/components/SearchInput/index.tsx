import { InputAdornment, SvgIcon, TextField } from '@mui/material'
import SearchIcon from '@/public/images/common/search.svg'
import { useCallback } from 'react'
import { debounce } from 'lodash'

interface SearchInputProps {
  placeholder?: string
  onSearch: (value: string) => void
  debounceTime?: number
}

const SearchInput = ({ onSearch, debounceTime = 300 }: SearchInputProps) => {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleSearch = useCallback(debounce(onSearch, debounceTime), [onSearch, debounceTime])

  return (
    <TextField
      aria-label="Search"
      placeholder="Search"
      variant="filled"
      hiddenLabel
      onChange={(e) => {
        handleSearch(e.target.value)
      }}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SvgIcon component={SearchIcon} inheritViewBox color="border" fontSize="small" data-testid="search-icon" />
          </InputAdornment>
        ),
        disableUnderline: true,
      }}
      size="small"
      sx={{
        transition: 'width 0.15s ease-in-out',
        width: { xs: '100%', sm: '250px' },
        '&:focus-within': {
          width: { xs: '100%', sm: '470px' },
        },
      }}
    />
  )
}

export default SearchInput
