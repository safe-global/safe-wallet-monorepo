import EthHashInfo from '@/components/common/EthHashInfo'
import { useAddressName } from '@/components/common/NamedAddressInfo'
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
  const toAddress = txData?.to.value
  const customTxInfo = txInfo && isCustomTxInfo(txInfo) ? txInfo : undefined
  const toInfo = customTxInfo?.to || txData?.addressInfoIndex?.[txData?.to.value] || txData?.to
  const toName = toInfo?.name || (toInfo && 'displayName' in toInfo ? String(toInfo.displayName || '') : undefined)
  const toLogo = toInfo?.logoUri
  const contractInfo = useAddressName(toAddress, toName)
  const name = toName || contractInfo?.name
  const logo = toLogo || contractInfo?.logoUri

  return toAddress && (name || logo) ? (
    <Chip
      sx={{
        backgroundColor: contractInfo?.isUnverifiedContract
          ? 'error.background'
          : withBackground
            ? 'Background.main'
            : 'background.paper',
        color: contractInfo?.isUnverifiedContract ? 'error.main' : undefined,
        height: 'unset',
      }}
      label={
        <EthHashInfo address={toAddress} name={name} customAvatar={logo} showAvatar={!!logo} avatarSize={20} onlyName />
      }
    ></Chip>
  ) : null
}

export default NameChip
