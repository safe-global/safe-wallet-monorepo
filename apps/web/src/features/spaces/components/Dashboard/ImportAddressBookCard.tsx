import { Typography, Paper, Box, Button, SvgIcon } from '@mui/material'
import css from '@/features/spaces/components/Dashboard/styles.module.css'
import AddressBookIcon from '@/public/images/sidebar/address-book.svg'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS, SPACE_LABELS } from '@/services/analytics/events/spaces'

const AddressBookCard = () => {
  const handleImport = () => {
    trackEvent({ ...SPACE_EVENTS.IMPORT_ADDRESS_BOOK, label: SPACE_LABELS.space_dashboard_card })
    // TODO: Implement import functionality
  }

  return (
    <Paper sx={{ p: 3, borderRadius: '12px', height: '100%' }}>
      <Box position="relative" width={1}>
        <Box className={css.iconBG}>
          <SvgIcon component={AddressBookIcon} inheritViewBox />
        </Box>

        <Button
          onClick={handleImport}
          variant="outlined"
          size="compact"
          sx={{ position: 'absolute', top: 0, right: 0 }}
          aria-label="Import address book"
        >
          Import
        </Button>
      </Box>
      <Box>
        <Typography variant="body1" color="text.primary" fontWeight={700} mb={1}>
          Import address book
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Simplify managing your funds collaboratively by importing your local address book. It will be available to all
          members of the space.
        </Typography>
      </Box>
    </Paper>
  )
}

export default AddressBookCard
