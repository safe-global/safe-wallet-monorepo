import { Alert, Box, Chip, SvgIcon, Typography } from '@mui/material'
import { ZeroAddress } from 'ethers'
import InfoIcon from '@/public/images/notifications/info.svg'
import SafeIcon from '@/components/common/SafeIcon'

const EmojiPreview = () => (
  <>
    <Chip label="New" color="secondary" sx={{ fontWeight: 'bold', borderRadius: 2 }} />

    <Alert severity="success" sx={{ marginTop: 2, borderColor: 'secondary.main' }} icon={<></>}>
      <SvgIcon component={InfoIcon} sx={{ marginRight: 1, verticalAlign: 'middle' }} color="secondary" />

      <Typography component="span">Enable emojis for your Safe Accounts.</Typography>

      <Box mt={1} display="flex" alignItems="center" gap={1}>
        <SafeIcon address={ZeroAddress} />
        <Typography variant="body2">{ZeroAddress}</Typography>
      </Box>
    </Alert>
  </>
)

export default EmojiPreview
