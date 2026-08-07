import { type ReactElement } from 'react'
import { Box, Switch, DialogContent, FormControlLabel, Typography } from '@mui/material'
import ModalDialog from '@/components/common/ModalDialog'
import useSafeAddress from '@/hooks/useSafeAddress'
import { useCurrentChain } from '@/hooks/useChains'
import QRCode from '@/components/common/QRCode'
import EthHashInfo from '@/components/common/EthHashInfo'
import { useAppDispatch, useAppSelector } from '@/store'
import { selectSettings, setQrShortName } from '@/store/settingsSlice'

const QrModal = ({ onClose }: { onClose: () => void }): ReactElement => {
  const safeAddress = useSafeAddress()
  const chain = useCurrentChain()
  const settings = useAppSelector(selectSettings)
  const dispatch = useAppDispatch()
  const qrPrefix = settings.shortName.qr ? `${chain?.shortName}:` : ''
  const qrCode = `${qrPrefix}${safeAddress}`
  const chainName = chain?.chainName || ''
  const nativeToken = chain?.nativeCurrency.symbol || ''

  return (
    <ModalDialog
      open
      dialogTitle="Receive assets"
      onClose={onClose}
      hideChainIndicator
      slotProps={{ paper: { sx: { borderRadius: '24px' } } }}
    >
      <DialogContent>
        <Box bgcolor={chain?.theme.backgroundColor} color={chain?.theme.textColor} px={3} py={2} mx={-3}>
          {chainName} only &mdash; assets sent from other networks will be lost.
        </Box>

        <Typography my={2}>
          Scan the QR or copy the address below to deposit {nativeToken} and any ERC‑20 or ERC‑721 token.
        </Typography>

        <Box display="flex" flexDirection="column" flexWrap="wrap" justifyContent="center" alignItems="center" my={2}>
          <Box mt={1} mb={1} p={1} border="1px solid" borderColor="border.main" borderRadius={1}>
            <QRCode value={qrCode} size={164} />
          </Box>

          <FormControlLabel
            control={
              <Switch checked={settings.shortName.qr} onChange={(e) => dispatch(setQrShortName(e.target.checked))} />
            }
            label={
              <>
                QR code with chain prefix (<b>{chain?.shortName}:</b>)
              </>
            }
          />

          <Box mt={2}>
            <EthHashInfo
              address={safeAddress}
              shortAddress={false}
              showPrefix={qrPrefix.length > 0}
              hasExplorer
              showCopyButton
            />
          </Box>
        </Box>
      </DialogContent>
    </ModalDialog>
  )
}

export default QrModal
