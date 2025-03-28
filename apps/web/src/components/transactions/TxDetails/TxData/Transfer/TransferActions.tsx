import type { MouseEvent } from 'react'
import { type ReactElement, useContext, useState } from 'react'
import IconButton from '@mui/material/IconButton'
import MoreHorizIcon from '@mui/icons-material/MoreHoriz'
import MenuItem from '@mui/material/MenuItem'
import ListItemText from '@mui/material/ListItemText'

import useAddressBook from '@/hooks/useAddressBook'
import EntryDialog from '@/components/address-book/EntryDialog'
import ContextMenu from '@/components/common/ContextMenu'
import { TokenTransferFlow } from '@/components/tx-flow/flows'
import type { Transfer } from '@safe-global/safe-gateway-typescript-sdk'
import { ZERO_ADDRESS } from '@safe-global/protocol-kit/dist/src/utils/constants'
import { isERC20Transfer, isNativeTokenTransfer, isOutgoingTransfer } from '@/utils/transaction-guards'
import { trackEvent, TX_LIST_EVENTS } from '@/services/analytics'
import { safeFormatUnits } from '@safe-global/utils/utils/formatters'
import CheckWallet from '@/components/common/CheckWallet'
import { TxModalContext } from '@/components/tx-flow'

// TODO: No need for an enum anymore
enum ModalType {
  ADD_TO_AB = 'ADD_TO_AB',
}

const ETHER = 'ether'

const defaultOpen = { [ModalType.ADD_TO_AB]: false }

const TransferActions = ({
  address,
  txInfo,
  trusted,
}: {
  address: string
  txInfo: Transfer
  trusted: boolean
}): ReactElement => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | undefined>()
  const [open, setOpen] = useState<typeof defaultOpen>(defaultOpen)
  const addressBook = useAddressBook()
  const name = addressBook?.[address]
  const { setTxFlow } = useContext(TxModalContext)

  const handleOpenContextMenu = (e: MouseEvent<HTMLButtonElement, globalThis.MouseEvent>) => {
    setAnchorEl(e.currentTarget)
  }

  const handleCloseContextMenu = () => {
    setAnchorEl(undefined)
  }

  const handleOpenModal = (type: keyof typeof open, event?: typeof TX_LIST_EVENTS.ADDRESS_BOOK) => () => {
    handleCloseContextMenu()
    setOpen((prev) => ({ ...prev, [type]: true }))

    if (event) {
      trackEvent(event)
    }
  }

  const handleCloseModal = () => {
    setOpen(defaultOpen)
  }

  const recipient = txInfo.recipient.value
  const tokenAddress = isNativeTokenTransfer(txInfo.transferInfo) ? ZERO_ADDRESS : txInfo.transferInfo.tokenAddress

  const amount = isNativeTokenTransfer(txInfo.transferInfo)
    ? safeFormatUnits(txInfo.transferInfo.value, ETHER)
    : isERC20Transfer(txInfo.transferInfo)
      ? safeFormatUnits(txInfo.transferInfo.value, txInfo.transferInfo.decimals)
      : undefined

  const isOutgoingTx = isOutgoingTransfer(txInfo)
  const canSendAgain =
    trusted && isOutgoingTx && (isNativeTokenTransfer(txInfo.transferInfo) || isERC20Transfer(txInfo.transferInfo))

  return (
    <>
      <IconButton edge="end" size="small" onClick={handleOpenContextMenu} sx={{ ml: '4px' }}>
        <MoreHorizIcon sx={({ palette }) => ({ color: palette.border.main })} fontSize="small" />
      </IconButton>
      <ContextMenu anchorEl={anchorEl} open={!!anchorEl} onClose={handleCloseContextMenu}>
        {canSendAgain && (
          <CheckWallet>
            {(isOk) => (
              <MenuItem
                onClick={() => {
                  handleCloseContextMenu()
                  setTxFlow(<TokenTransferFlow recipients={[{ recipient, tokenAddress, amount }]} />)
                }}
                disabled={!isOk}
              >
                <ListItemText>Send again</ListItemText>
              </MenuItem>
            )}
          </CheckWallet>
        )}

        <MenuItem onClick={handleOpenModal(ModalType.ADD_TO_AB, TX_LIST_EVENTS.ADDRESS_BOOK)}>
          <ListItemText>Add to address book</ListItemText>
        </MenuItem>
      </ContextMenu>

      {open[ModalType.ADD_TO_AB] && (
        <EntryDialog handleClose={handleCloseModal} defaultValues={{ name, address }} disableAddressInput />
      )}
    </>
  )
}

export default TransferActions
