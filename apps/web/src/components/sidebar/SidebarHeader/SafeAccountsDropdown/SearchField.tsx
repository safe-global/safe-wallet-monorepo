import type { ReactElement } from 'react'
import { useMemo } from 'react'
import { TextField, InputAdornment, IconButton } from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import ClearIcon from '@mui/icons-material/Clear'
import { debounce } from 'lodash'

import css from './styles.module.css'

type SearchFieldProps = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

const SearchField = ({ value, onChange, placeholder = 'Search safes...' }: SearchFieldProps): ReactElement => {
  // Debounced search handler (300ms)
  const debouncedOnChange = useMemo(
    () =>
      debounce((newValue: string) => {
        onChange(newValue)
      }, 300),
    [onChange],
  )

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    debouncedOnChange(event.target.value)
  }

  const handleClear = () => {
    onChange('')
  }

  return (
    <TextField
      className={css.searchField}
      fullWidth
      size="small"
      placeholder={placeholder}
      onChange={handleChange}
      defaultValue={value}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon fontSize="small" />
          </InputAdornment>
        ),
        endAdornment: value ? (
          <InputAdornment position="end">
            <IconButton size="small" onClick={handleClear} edge="end">
              <ClearIcon fontSize="small" />
            </IconButton>
          </InputAdornment>
        ) : null,
      }}
    />
  )
}

export default SearchField
