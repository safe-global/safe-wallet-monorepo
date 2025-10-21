import Grid from '@mui/material/Grid'
import TextField from '@mui/material/TextField'
import InputAdornment from '@mui/material/InputAdornment'
import SvgIcon from '@mui/material/SvgIcon'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import OutlinedInput from '@mui/material/OutlinedInput'
import ListItemText from '@mui/material/ListItemText'
import Select from '@mui/material/Select'
import IconButton from '@mui/material/IconButton'
import Box from '@mui/material/Box'
import Checkbox from '@mui/material/Checkbox'
import FormLabel from '@mui/material/FormLabel'
import FormControl from '@mui/material/FormControl'
import FormControlLabel from '@mui/material/FormControlLabel'
import Tooltip from '@mui/material/Tooltip'
import CloseIcon from '@mui/icons-material/Close'
import type { SelectChangeEvent } from '@mui/material/Select'
import type { SafeApp as SafeAppData } from '@safe-global/store/gateway/AUTO_GENERATED/safe-apps'

import { getUniqueTags } from '@/components/safe-apps/utils'
import SearchIcon from '@/public/images/common/search.svg'
import BatchIcon from '@/public/images/apps/batch-icon.svg'
import css from './styles.module.css'

export type safeAppCatogoryOptionType = {
  label: string
  value: string
}

type SafeAppsFiltersProps = {
  onChangeQuery: (newQuery: string) => void
  onChangeFilterCategory: (category: string[]) => void
  onChangeOptimizedWithBatch: (optimizedWithBatch: boolean) => void
  selectedCategories: string[]
  safeAppsList: SafeAppData[]
}

const SafeAppsFilters = ({
  onChangeQuery,
  onChangeFilterCategory,
  onChangeOptimizedWithBatch,
  selectedCategories,
  safeAppsList,
}: SafeAppsFiltersProps) => {
  const categoryOptions = getCategoryOptions(safeAppsList)

  return (
    <Grid container spacing={2} className={css.filterContainer}>
      <Grid item xs={12} sm={12} md={6} lg={6}>
        {/* Search by name */}
        <TextField
          id="search-by-name"
          placeholder="Search by name or category"
          aria-label="Search Safe App by name"
          variant="filled"
          hiddenLabel
          onChange={(e) => {
            onChangeQuery(e.target.value)
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SvgIcon component={SearchIcon} inheritViewBox color="border" />
              </InputAdornment>
            ),
            disableUnderline: true,
          }}
          fullWidth
          size="small"
          sx={{
            '& > .MuiInputBase-root': { padding: '8px 16px' },
          }}
        />
      </Grid>

      {/* Select Category */}
      <Grid item xs={12} sm={6} md={3} lg={3}>
        <FormControl fullWidth>
          <InputLabel id="select-safe-app-category-label" shrink>
            Category
          </InputLabel>
          <Select
            labelId="select-safe-app-category-label"
            id="safe-app-category-selector"
            displayEmpty
            multiple
            value={selectedCategories}
            onChange={(event: SelectChangeEvent<string[]>) => {
              onChangeFilterCategory(event.target.value as string[])
            }}
            input={<OutlinedInput label="Category" fullWidth notched sx={{ paddingRight: '18px' }} />}
            renderValue={(selected) =>
              selected.length === 0 ? 'Select category' : `${selected.length} categories selected`
            }
            fullWidth
            MenuProps={categoryMenuProps}
          >
            {categoryOptions.length > 0 ? (
              categoryOptions.map((category) => (
                <MenuItem
                  sx={{ padding: '0 6px 2px 6px', height: CATEGORY_OPTION_HEIGHT }}
                  key={category.value}
                  value={category.value}
                  disableGutters
                >
                  <Checkbox
                    disableRipple
                    sx={{ '& .MuiSvgIcon-root': { fontSize: 24 }, padding: '3px' }}
                    checked={selectedCategories.includes(category.value)}
                  />
                  <ListItemText
                    primary={category.label}
                    primaryTypographyProps={{ fontSize: 14, paddingLeft: '5px' }}
                  />
                </MenuItem>
              ))
            ) : (
              <MenuItem disabled sx={{ padding: '0 6px 2px 6px', height: CATEGORY_OPTION_HEIGHT }} disableGutters>
                <ListItemText
                  primary="No categories defined"
                  primaryTypographyProps={{ fontSize: 14, paddingLeft: '5px' }}
                />
              </MenuItem>
            )}
          </Select>

          {/* clear selected categories button */}
          {selectedCategories.length > 0 && (
            <Tooltip title="clear selected categories" placement="top">
              <IconButton
                onClick={() => {
                  onChangeFilterCategory([])
                }}
                sx={{ position: 'absolute', top: '16px', right: '28px' }}
                color="default"
                component="label"
                size="small"
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </FormControl>
      </Grid>

      {/* Optimized with Batch Transaction */}
      <Grid item xs={12} sm={6} md={3} lg={3}>
        <Tooltip
          title={
            <div style={{ textAlign: 'center' }}>
              Merge multiple transactions into one to save time and gas fees inside apps offering this feature
            </div>
          }
        >
          <FormControl variant="standard">
            <FormLabel className={css.optimizedWithBatchLabel}>Optimized with</FormLabel>
            <FormControlLabel
              control={<Checkbox />}
              onChange={(_, value) => {
                onChangeOptimizedWithBatch(value)
              }}
              label={
                <Box display="flex" alignItems="center" gap={1}>
                  <span>Batch transactions</span> <BatchIcon />
                </Box>
              }
            />
          </FormControl>
        </Tooltip>
      </Grid>
    </Grid>
  )
}

export default SafeAppsFilters

const CATEGORY_OPTION_HEIGHT = 34
const CATEGORY_OPTION_PADDING_TOP = 8
const ITEMS_SHOWED = 11.5
const categoryMenuProps = {
  sx: {
    '& .MuiList-root': { padding: '9px 0' },
  },
  PaperProps: {
    style: {
      maxHeight: CATEGORY_OPTION_HEIGHT * ITEMS_SHOWED + CATEGORY_OPTION_PADDING_TOP,
      overflow: 'scroll',
    },
  },
}

export const getCategoryOptions = (safeAppList: SafeAppData[]): safeAppCatogoryOptionType[] => {
  return getUniqueTags(safeAppList).map((category) => ({
    label: category,
    value: category,
  }))
}
