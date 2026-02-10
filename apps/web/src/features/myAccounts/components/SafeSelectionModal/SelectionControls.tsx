import { Box, Button, Typography } from '@mui/material'

interface SelectionControlsProps {
  selectedCount: number
  totalCount: number
  allSelected: boolean
  isLoading: boolean
  onSelectAll: () => void
  onDeselectAll: () => void
}

/**
 * Selection controls for the safe selection modal (count + select/deselect buttons)
 */
const SelectionControls = ({
  selectedCount,
  totalCount,
  allSelected,
  isLoading,
  onSelectAll,
  onDeselectAll,
}: SelectionControlsProps) => {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
      <Typography variant="body2" color="text.secondary">
        {selectedCount} of {totalCount} selected
      </Typography>
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Button
          size="small"
          variant="outlined"
          onClick={onSelectAll}
          disabled={allSelected || isLoading}
          sx={{
            '@media (max-width: 600px)': {
              height: 'fit-content',
            },
          }}
        >
          Select All
        </Button>
        <Button
          size="small"
          variant="outlined"
          onClick={onDeselectAll}
          disabled={selectedCount === 0 || isLoading}
          sx={{
            '@media (max-width: 600px)': {
              height: 'fit-content',
            },
          }}
        >
          Deselect All
        </Button>
      </Box>
    </Box>
  )
}

export default SelectionControls
