import { SvgIcon, Popover, Button, Box } from '@mui/material'
import { useContext } from 'react'
import type { ReactElement } from 'react'

import AddIcon from '@/public/images/common/add.svg'
import { ModalDialogTitle } from '@/components/common/ModalDialog'
import { CreateSubaccount } from '@/components/tx-flow/flows/CreateSubaccount'
import { TxModalContext } from '@/components/tx-flow'
import { SubaccountsList } from '@/components/sidebar/SubaccountsList'
import { SubaccountInfo } from '@/components/sidebar/SubaccountInfo'
import { base } from '@/styles/spacings'
import { useGetSafesByOwnerQuery } from '@/store/slices'
import Track from '@/components/common/Track'
import { OVERVIEW_EVENTS } from '@/services/analytics'

export function SubaccountsPopover({
  anchorEl,
  onClose,
  chainId,
  safeAddress,
}: {
  anchorEl: HTMLElement | null
  onClose: () => void
  chainId: string
  safeAddress: string
}): ReactElement {
  const { setTxFlow } = useContext(TxModalContext)
  const { data: subaccounts } = useGetSafesByOwnerQuery({ chainId, ownerAddress: safeAddress })

  const onAdd = () => {
    setTxFlow(<CreateSubaccount />)
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
        vertical: -1 * base,
        horizontal: 'left',
      }}
      slotProps={{ paper: { sx: { width: '300px' } } }}
    >
      <ModalDialogTitle
        hideChainIndicator
        onClose={onClose}
        sx={{ borderBottom: ({ palette }) => `1px solid ${palette.border.light}` }}
      >
        Subaccounts
      </ModalDialogTitle>
      <Box
        sx={{
          p: 3,
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '590px',
        }}
      >
        {subaccounts?.safes ? (
          subaccounts.safes.length === 0 ? (
            <SubaccountInfo />
          ) : (
            <Box sx={{ overflowX: 'hidden' }}>
              <SubaccountsList subaccounts={subaccounts.safes} />
            </Box>
          )
        ) : null}
        <Track {...OVERVIEW_EVENTS.ADD_SUBACCOUNT}>
          <Button variant="contained" sx={{ width: '100%', mt: 3 }} onClick={onAdd}>
            <SvgIcon component={AddIcon} inheritViewBox fontSize="small" />
            Add Subaccount
          </Button>
        </Track>
      </Box>
    </Popover>
  )
}
