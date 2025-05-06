import { Typography, Paper, Box, Button, SvgIcon, Chip, Stack } from '@mui/material'
import css from '@/features/spaces/components/Dashboard/styles.module.css'
import AddressBookIcon from '@/public/images/sidebar/address-book.svg'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS, SPACE_LABELS } from '@/services/analytics/events/spaces'
import { useState } from 'react'
import ImportAddressBookDialog from '@/features/spaces/components/SpaceAddressBook/Import/ImportAddressBookDialog'
import useGetSpaceAddressBook from '@/features/spaces/hooks/useGetSpaceAddressBook'
import CheckIcon from '@/public/images/common/check.svg'
import classnames from 'classnames'

const AddressBookCard = () => {
  const [open, setOpen] = useState(false)
  const addressBookItems = useGetSpaceAddressBook()

  const handleImport = () => {
    trackEvent({ ...SPACE_EVENTS.IMPORT_ADDRESS_BOOK, label: SPACE_LABELS.space_dashboard_card })
    setOpen(true)
  }

  return (
    <>
      <Paper sx={{ p: 3, borderRadius: '12px', height: '100%' }}>
        <Box position="relative" width={1}>
          <Box className={classnames(css.iconBG, css.iconBGBlue)}>
            <SvgIcon component={AddressBookIcon} inheritViewBox color="info" />
          </Box>

          {addressBookItems.length > 0 ? (
            <Chip
              label={
                <Stack direction="row" gap={0.5}>
                  <SvgIcon component={CheckIcon} inheritViewBox fontSize="small" />
                  <Typography variant="caption" fontWeight="bold">
                    Done
                  </Typography>
                </Stack>
              }
              sx={{
                borderRadius: '6px',
                backgroundColor: 'success.background',
                color: 'success.main',
                position: 'absolute',
                top: 0,
                right: 0,
              }}
            />
          ) : (
            <Button
              onClick={handleImport}
              variant="outlined"
              size="compact"
              sx={{ position: 'absolute', top: 0, right: 0 }}
              aria-label="Import address book"
            >
              Import address book
            </Button>
          )}
        </Box>
        <Box>
          <Typography variant="body1" color="text.primary" fontWeight={700} mb={1}>
            Import address book
          </Typography>
          <Typography variant="body2" color="primary.light">
            Simplify managing your funds collaboratively by importing your local address book. It will be available to
            all members of the space.
          </Typography>
        </Box>
      </Paper>
      {open && <ImportAddressBookDialog handleClose={() => setOpen(false)} />}
    </>
  )
}

export default AddressBookCard
