import type { TransferTransactionInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { type ReactElement, useContext, useState } from 'react'
import { Ellipsis } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import useAddressBook from '@/hooks/useAddressBook'
import EntryDialog from '@/components/address-book/EntryDialog'
import { TokenTransferFlow } from '@/components/tx-flow/flows'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
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
  txInfo: TransferTransactionInfo
  trusted: boolean
}): ReactElement => {
  const [menuOpen, setMenuOpen] = useState(false)
  const [open, setOpen] = useState<typeof defaultOpen>(defaultOpen)
  const addressBook = useAddressBook()
  const name = addressBook?.[address]
  const { setTxFlow } = useContext(TxModalContext)

  const handleOpenModal = (type: keyof typeof open, event?: typeof TX_LIST_EVENTS.ADDRESS_BOOK) => () => {
    setMenuOpen(false)
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
    ? safeFormatUnits(txInfo.transferInfo.value ?? '0', ETHER)
    : isERC20Transfer(txInfo.transferInfo)
      ? safeFormatUnits(txInfo.transferInfo.value, txInfo.transferInfo.decimals)
      : undefined

  const isOutgoingTx = isOutgoingTransfer(txInfo)
  const canSendAgain =
    trusted && isOutgoingTx && (isNativeTokenTransfer(txInfo.transferInfo) || isERC20Transfer(txInfo.transferInfo))

  return (
    <>
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger
          render={<Button variant="ghost" size="icon-sm" className="ml-1 text-[var(--color-border-main)]" />}
        >
          <Ellipsis />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {canSendAgain && (
            <CheckWallet>
              {(isOk) => (
                <DropdownMenuItem
                  onClick={() => {
                    setMenuOpen(false)
                    setTxFlow(<TokenTransferFlow recipients={[{ recipient, tokenAddress, amount }]} />)
                  }}
                  disabled={!isOk}
                >
                  Send again
                </DropdownMenuItem>
              )}
            </CheckWallet>
          )}

          <DropdownMenuItem onClick={handleOpenModal(ModalType.ADD_TO_AB, TX_LIST_EVENTS.ADDRESS_BOOK)}>
            Add to address book
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {open[ModalType.ADD_TO_AB] && (
        <EntryDialog handleClose={handleCloseModal} defaultValues={{ name, address }} disableAddressInput />
      )}
    </>
  )
}

export default TransferActions
