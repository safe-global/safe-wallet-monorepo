import EthHashInfo from '@/components/common/EthHashInfo'
import { useAddressName } from '@/components/common/NamedAddressInfo'
import useAddressBook from '@/hooks/useAddressBook'
import { isCustomTxInfo } from '@/utils/transaction-guards'
import { Chip } from '@mui/material'
import type { TransactionData, TransactionDetails } from '@safe-global/safe-gateway-typescript-sdk'

const NameChip = ({
  txData,
  withBackground,
  txInfo,
}: {
  txData?: TransactionData
  txInfo?: TransactionDetails['txInfo']
  withBackground?: boolean
}) => {
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
      sx={{
        backgroundColor: isUntrusted ? 'error.background' : withBackground ? 'background.main' : 'background.paper',
        color: isUntrusted ? 'error.main' : undefined,
        height: 'unset',
      }}
      label={
        <EthHashInfo address={toAddress} name={name} customAvatar={logo} showAvatar={!!logo} avatarSize={20} onlyName />
      }
    ></Chip>
  ) : null
}

export default NameChip
