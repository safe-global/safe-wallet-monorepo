import { HexEncodedData } from '@/components/transactions/HexEncodedData'
import CopyButton from '@/components/common/CopyButton'
import DialogActions from '@/components/common/DialogActions'
import ledgerHashStore from '../../store/ledgerHashStore'
import { HASH_DISPLAY_LIMIT } from '../../constants'
import { LedgerHashComparisonView } from '@views/features/ledger/components/LedgerHashComparison/LedgerHashComparisonView'

const LedgerHashComparison = () => {
  const hash = ledgerHashStore.useStore()
  const open = !!hash

  const handleClose = () => {
    ledgerHashStore.setStore(undefined)
  }

  return (
    <LedgerHashComparisonView
      open={open}
      onClose={handleClose}
      hexData={<HexEncodedData hexData={hash || ''} highlightFirstBytes={false} limit={HASH_DISPLAY_LIMIT} />}
      copyButton={<CopyButton text={hash || ''} />}
      renderDialogActions={(props) => <DialogActions {...props} />}
    />
  )
}

export default LedgerHashComparison
