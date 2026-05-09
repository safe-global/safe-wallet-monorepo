import useSafeInfo from '@/hooks/useSafeInfo'
import useSafeAddress from '@/hooks/useSafeAddress'
import { useAppSelector } from '@/store'
import { selectSettings } from '@/store/settingsSlice'
import { useCurrentChain } from '@/hooks/useChains'
import { Box, Button, Stack, SvgIcon, Typography } from '@mui/material'
import FiatIcon from '@/public/images/common/fiat2.svg'
import CopyTooltip from '@/components/common/CopyTooltip'
import CopyIcon from '@/public/images/common/copy.svg'

const AddFundsToGetStarted = () => {
  const { safe } = useSafeInfo()
  const safeAddress = useSafeAddress()
  const settings = useAppSelector(selectSettings)
  const chain = useCurrentChain()

  const addressCopyText = settings.shortName.copy && chain ? `${chain.shortName}:${safeAddress}` : safeAddress

  if (!safe.deployed) return null

  return (
    <Stack
      direction={{ xs: 'column', md: 'row' }}
      sx={{ backgroundColor: 'info.light' }}
      p={2}
      gap={2}
      alignItems={{ xs: 'flex-start', md: 'center' }}
      borderRadius={1}
    >
      <Box
        width="40px"
        height="40px"
        bgcolor="background.paper"
        display="flex"
        alignItems="center"
        justifyContent="center"
        borderRadius="6px"
        flexShrink="0"
      >
        <SvgIcon component={FiatIcon} inheritViewBox fontSize="small" />
      </Box>
      <Box>
        <Typography fontWeight="bold" color="static.main">
          Add funds to get started
        </Typography>
        <Typography variant="body2" color="primary.light">
          Onramp crypto or send tokens directly to your address from a different wallet.{' '}
        </Typography>
      </Box>
      <Box ml={{ xs: 0, md: 'auto' }}>
        <CopyTooltip text={addressCopyText}>
          <Button
            variant="contained"
            color="background.paper"
            startIcon={<SvgIcon component={CopyIcon} inheritViewBox fontSize="small" />}
            size="small"
            disableElevation
          >
            Copy address
          </Button>
        </CopyTooltip>
      </Box>
    </Stack>
  )
}

export default AddFundsToGetStarted
