import { Button, Grid, Paper, Typography } from '@mui/material'
// import EthHashInfo from '@/components/common/EthHashInfo'
// import QRCode from '@/components/common/QRCode'
import { useCurrentChain } from '@/hooks/useChains'
import useSafeAddress from '@/hooks/useSafeAddress'
import { useAppDispatch, useAppSelector } from '@/store'
import { selectSettings } from '@/store/settingsSlice'
import TopUpModal from '@/components/superChain/TopUpModal'
import { useState } from 'react'
// import BuyCryptoButton from '@/components/common/BuyCryptoButton'

const AddFundsCTA = () => {
  const [isTopUpOpen, setIsTopUpOpen] = useState(false)
  const safeAddress = useSafeAddress()
  const chain = useCurrentChain()
  const dispatch = useAppDispatch()
  const settings = useAppSelector(selectSettings)
  const qrPrefix = settings.shortName.qr ? `${chain?.shortName}:` : ''
  const qrCode = `${qrPrefix}${safeAddress}`

  return (
    <>
      <Paper
        style={{
          height: '100%',
        }}
      >
        {/* <Grid container gap={3} alignItems="center" justifyContent="center" p={4}> */}
        {/* <Grid item>
          <div>
            <Box p={2} border="1px solid" borderColor="border.light" borderRadius={1} display="inline-block">
              <QRCode value={qrCode} size={195} />
            </Box>
          </div>

          <FormControlLabel
            control={
              <Switch checked={settings.shortName.qr} onChange={(e) => dispatch(setQrShortName(e.target.checked))} />
            }
            label={<>QR code with chain prefix</>}
          />
        </Grid> */}

        <Grid container gap={2} height="100%" alignItems="center" justifyContent="center" p={4} flexDirection="column">
          {/* <Typography variant="h3" fontWeight="bold">
            Add funds to get started
          </Typography> */}

          <Typography>Top up your account with funds to get started</Typography>

          {/* <Box bgcolor="background.main" p={2} borderRadius="6px" alignSelf="flex-start" fontSize="14px">
            <EthHashInfo address={safeAddress} shortAddress={false} showCopyButton hasExplorer avatarSize={24} />
          </Box> */}

          {/* <BuyCryptoButton /> */}
          <Button onClick={() => setIsTopUpOpen(true)} variant="contained" color="primary" size="large">
            Add funds
          </Button>
        </Grid>
        {/* </Grid> */}
      </Paper>
      <TopUpModal open={isTopUpOpen} onClose={() => setIsTopUpOpen(false)} />
    </>
  )
}

export default AddFundsCTA
