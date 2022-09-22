import { useState } from 'react'
import Button from '@mui/material/Button'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import Box from '@mui/material/Box'
import TxFilterForm from '@/components/transactions/TxFilterForm'
import { useTxFilter } from '@/utils/tx-history-filter'

const TxFilterButton = () => {
  const [filter] = useTxFilter()

  const [showFilter, setShowFilter] = useState(false)

  const toggleFilter = () => {
    setShowFilter((prev) => !prev)
  }

  const ExpandIcon = showFilter ? ExpandLessIcon : ExpandMoreIcon

  return (
    <>
      <Button variant="outlined" onClick={toggleFilter} size="small">
        {filter?.type ?? 'Filter'}
        <ExpandIcon fontSize="small" />
      </Button>

      {showFilter && (
        <Box pt={1} width="100%">
          <TxFilterForm toggleFilter={toggleFilter} />
        </Box>
      )}
    </>
  )
}

export default TxFilterButton
