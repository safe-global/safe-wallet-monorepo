import { useState } from 'react'
import type { TransactionData, TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import EthHashInfo from '@/components/common/EthHashInfo'
import { useAddressName } from '@/components/common/NamedAddressInfo'
import useAddressBook from '@/hooks/useAddressBook'
import useChainId from '@/hooks/useChainId'
import { isCustomTxInfo } from '@/utils/transaction-guards'
import { Box, Chip, IconButton, Tooltip } from '@mui/material'
import DataObjectIcon from '@mui/icons-material/DataObject'
import { useAppSelector } from '@/store'
import { selectCustomAbisByChain } from '@/store/customAbiSlice'
import CustomAbiDialog from '@/components/settings/CustomAbis/CustomAbiDialog'

const NameChip = ({ txData, txInfo }: { txData?: TransactionData | null; txInfo?: TransactionDetails['txInfo'] }) => {
  const addressBook = useAddressBook()
  const chainId = useChainId()
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

  const customAbis = useAppSelector((state) => selectCustomAbisByChain(state, chainId))
  const hasCustomAbi = !!toAddress && !!customAbis[toAddress]
  const showAddAbi = isUntrusted && !hasCustomAbi && !!toAddress

  const [dialogOpen, setDialogOpen] = useState(false)

  return toAddress && (name || logo) ? (
    <>
      <Box display="flex" alignItems="center" gap={0.5}>
        <Chip
          data-testid="name-chip"
          sx={{
            backgroundColor: isUntrusted ? 'error.background' : 'background.paper',
            color: isUntrusted ? 'error.main' : undefined,
            height: 'unset',
          }}
          label={
            <EthHashInfo
              address={toAddress}
              name={name}
              customAvatar={logo}
              showAvatar={!!logo}
              avatarSize={20}
              onlyName
            />
          }
        />
        {showAddAbi && (
          <Tooltip title="Add custom ABI" placement="top">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation()
                setDialogOpen(true)
              }}
              sx={{ p: 0.25 }}
            >
              <DataObjectIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>
      {dialogOpen && <CustomAbiDialog onClose={() => setDialogOpen(false)} defaultAddress={toAddress} />}
    </>
  ) : null
}

export default NameChip
