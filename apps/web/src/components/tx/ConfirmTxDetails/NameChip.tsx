import type { TransactionData, TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import EthHashInfo from '@/components/common/EthHashInfo'
import { useAddressName } from '@/components/common/NamedAddressInfo'
import useAddressBook from '@/hooks/useAddressBook'
import { isCustomTxInfo } from '@/utils/transaction-guards'
import { Chip } from '@/components/ui/chip'
import { cn } from '@/utils/cn'

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
    <Chip
      data-testid="name-chip"
      className={cn(
        'h-auto',
        isUntrusted
          ? 'bg-[var(--color-error-background)] text-[var(--color-error-main)]'
          : 'bg-[var(--color-background-paper)]',
      )}
    >
      <EthHashInfo address={toAddress} name={name} customAvatar={logo} showAvatar={!!logo} avatarSize={20} onlyName />
    </Chip>
  ) : null
}

export default NameChip
