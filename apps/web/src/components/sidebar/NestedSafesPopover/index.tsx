import { SvgIcon, Popover, Button, Box, Stack } from '@mui/material'
import { useContext } from 'react'
import type { ReactElement } from 'react'

import AddIcon from '@/public/images/common/add.svg'
import { ModalDialogTitle } from '@/components/common/ModalDialog'
import { CreateNestedSafe } from '@/components/tx-flow/flows/CreateNestedSafe'
import { TxModalContext } from '@/components/tx-flow'
import { NestedSafesList } from '@/components/sidebar/NestedSafesList'
import { NestedSafeInfo } from '@/components/sidebar/NestedSafeInfo'
import Track from '@/components/common/Track'
import { NESTED_SAFE_EVENTS } from '@/services/analytics/events/nested-safes'

export function NestedSafesPopover({
  anchorEl,
  onClose,
  nestedSafes,
  hideCreationButton = false,
}: {
  anchorEl: HTMLElement | null
  onClose: () => void
  nestedSafes: Array<string>
  hideCreationButton?: boolean
}): ReactElement {
  const { setTxFlow } = useContext(TxModalContext)

  const onAdd = () => {
    setTxFlow(<CreateNestedSafe />)
    onClose()
  }

  return (
    <Popover
      open={!!anchorEl}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'left',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'left',
      }}
      slotProps={{
        paper: {
          sx: {
            width: '300px',
            maxHeight: '590px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          },
        },
      }}
    >
      <ModalDialogTitle
        hideChainIndicator
        onClose={onClose}
        sx={{ borderBottom: ({ palette }) => `1px solid ${palette.border.light}` }}
      >
        Nested Safes
      </ModalDialogTitle>
      <Stack p={3} pt={2} display="flex" flexDirection="column" flex={1} overflow="hidden">
        {nestedSafes.length === 0 ? (
          <NestedSafeInfo />
        ) : (
          <Box
            sx={{
              overflowX: 'hidden',
              overflowY: 'auto',
              flex: 1,
            }}
          >
            <NestedSafesList onClose={onClose} nestedSafes={nestedSafes} />
          </Box>
        )}
        {!hideCreationButton && (
          <Track {...NESTED_SAFE_EVENTS.ADD}>
            <Button variant="contained" sx={{ width: '100%', mt: 3 }} onClick={onAdd}>
              <SvgIcon component={AddIcon} inheritViewBox fontSize="small" />
              Add Nested Safe
            </Button>
          </Track>
        )}
      </Stack>
    </Popover>
  )
}
