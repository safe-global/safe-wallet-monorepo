import { type PropsWithChildren, useContext } from 'react'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import useTxPreview from '../confirmation-views/useTxPreview'
import useWallet from '@/hooks/wallets/useWallet'
import { isHardwareWallet, isLedgerLive } from '@/utils/wallets'
import { TxFlowStep } from '@/components/tx-flow/TxFlowStep'
import { Receipt } from '../ConfirmTxDetails/Receipt'
import { Slot, SlotName } from '@/components/tx-flow/slots'
import { Sign } from '@/components/tx-flow/actions/Sign'
import {
  CONFIRM_TX_RECEIPT_TITLE,
  ConfirmTxReceiptView,
  SIGN_OPTIONS,
} from '@views/components/tx/ConfirmTxReceipt/ConfirmTxReceiptView'

const SIGN_SLOT_ID = 'sign'

export const ConfirmTxReceipt = ({ children, onSubmit }: PropsWithChildren<{ onSubmit: () => void }>) => {
  const { safeTx } = useContext(SafeTxContext)
  const [txPreview] = useTxPreview(safeTx?.data)
  const wallet = useWallet()
  const showHashes = wallet ? isHardwareWallet(wallet) || isLedgerLive(wallet) : false

  // Render inside TxFlowStep (rather than bailing with `false`) so the step title still updates and
  // the user sees a loading state instead of an empty card with the previous step's stale title.
  if (!safeTx) {
    return (
      <TxFlowStep title={CONFIRM_TX_RECEIPT_TITLE} fixedNonce>
        <ConfirmTxReceiptView isLoading showHashes={showHashes} />
      </TxFlowStep>
    )
  }

  return (
    <TxFlowStep title={CONFIRM_TX_RECEIPT_TITLE} fixedNonce>
      <ConfirmTxReceiptView
        isLoading={false}
        showHashes={showHashes}
        receipt={<Receipt safeTxData={safeTx?.data} txData={txPreview?.txData} txInfo={txPreview?.txInfo} />}
        submit={
          <Slot name={SlotName.Submit} onSubmitSuccess={onSubmit} txPreview={txPreview}>
            <Sign onSubmitSuccess={onSubmit} options={SIGN_OPTIONS} onChange={() => {}} slotId={SIGN_SLOT_ID} />
          </Slot>
        }
      >
        {children}
      </ConfirmTxReceiptView>
    </TxFlowStep>
  )
}
