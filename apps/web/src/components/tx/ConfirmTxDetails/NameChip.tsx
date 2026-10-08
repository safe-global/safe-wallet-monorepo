import type { TransactionData, TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { useAddressName } from '@/components/common/NamedAddressInfo'
import useAddressBook from '@/hooks/useAddressBook'
import { isCustomTxInfo } from '@/utils/transaction-guards'
import { NameChipView } from '@views/components/tx/ConfirmTxDetails/NameChipView'

const NameChip = ({ txData, txInfo }: { txData?: TransactionData | null; txInfo?: TransactionDetails['txInfo'] }) => {
  const addressBook = useAddressBook()
  const toAddress = txData?.to.value
  const customTxInfo = txInfo && isCustomTxInfo(txInfo) ? txInfo : undefined
  const toInfo = customTxInfo?.to || txData?.addressInfoIndex?.[txData?.to.value] || txData?.to
  const nameFromAb = toAddress !== undefined ? addressBook[toAddress] : undefined
  const toName =
    nameFromAb || toInfo?.name || (toInfo && 'displayName' in toInfo ? String(toInfo.displayName || '') : undefined)
  const toLogo = toInfo?.logoUri
  const contractInfo = useAddressName(toAddress, toName)
  const name = toName || contractInfo?.name
  const logo = toLogo || contractInfo?.logoUri

  const isInAddressBook = !!nameFromAb
  const isUntrusted = !isInAddressBook && contractInfo.isUnverifiedContract

  return toAddress && (name || logo) ? (
    <NameChipView address={toAddress} name={name} logo={logo} isUntrusted={isUntrusted} />
  ) : null
}

export default NameChip
