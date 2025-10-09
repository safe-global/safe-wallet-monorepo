import { type ReactElement } from 'react'
import Typography from '@mui/material/Typography'
import Skeleton from '@mui/material/Skeleton'
import SafeIcon from '@/components/common/SafeIcon'
import useSafeAddress from '@/hooks/useSafeAddress'
import { useAddressResolver } from '@/hooks/useAddressResolver'
import { useAddressBookItem } from '@/hooks/useAllAddressBooks'
import useChainId from '@/hooks/useChainId'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import CopyAddressButton from '@/components/common/CopyAddressButton'
import { Box, Stack } from '@mui/material'
import { useChain } from '@/hooks/useChains'
import { useAppSelector } from '@/store'
import { selectSettings } from '@/store/settingsSlice'

const SafeInfo = (): ReactElement => {
  const safeAddress = useSafeAddress()
  const chainId = useChainId()
  const { ens } = useAddressResolver(safeAddress)
  const addressBookItem = useAddressBookItem(safeAddress, chainId)
  const chain = useChain(chainId)
  const settings = useAppSelector(selectSettings)

  const name = addressBookItem?.name || ens
  const prefix = chain?.shortName
  const copyPrefix = settings.shortName.copy

  return (
    <Stack data-testid="tx-flow-safe-info" direction="row" gap={1} alignItems="center">
      <Box data-testid="safe-icon">
        {safeAddress ? (
          <SafeIcon address={safeAddress} size={32} />
        ) : (
          <Skeleton variant="circular" width={32} height={32} />
        )}
      </Box>

      <Box>
        {safeAddress ? (
          <>
            {name && (
              <Typography variant="body2" fontWeight={700}>
                {name}
              </Typography>
            )}
            <Typography variant="body2">
              <CopyAddressButton address={safeAddress} prefix={prefix} copyPrefix={copyPrefix}>
                {prefix && <b>{prefix}:</b>}
                {shortenAddress(safeAddress)}
              </CopyAddressButton>
            </Typography>
          </>
        ) : (
          <Typography variant="body2">
            <Skeleton variant="text" width={86} />
            <Skeleton variant="text" width={120} />
          </Typography>
        )}
      </Box>
    </Stack>
  )
}

export default SafeInfo
