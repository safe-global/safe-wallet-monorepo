import { Box, Button, Card, IconButton, Stack, Typography } from '@mui/material'
import SafeCoinsIllustration from '@/components/common/SafeCoinsIllustration'
import css from './styles.module.css'
import CloseIcon from '@mui/icons-material/Close'
import Track from '@/components/common/Track'
import Link from 'next/link'
import { AppRoutes } from '@/config/routes'
import { useRouter } from 'next/router'
import InfoIcon from '@mui/icons-material/Info'
import useNoFeeNovemberEligibility from '@/hooks/useNoFeeNovemberEligibility'
import { useContext } from 'react'
import { TxModalContext } from '@/components/tx-flow'
import { NewTxFlow } from '@/components/tx-flow/flows'

export const noFeeNovemberBannerID = 'noFeeNovemberBanner'

const NoFeeNovemberBanner = ({ onDismiss }: { onDismiss: (eligibilityState?: boolean) => void }) => {
  const router = useRouter()
  const { setTxFlow } = useContext(TxModalContext)
  const { isEligible, isLoading, error } = useNoFeeNovemberEligibility()

  const handleNewTransaction = () => {
    setTxFlow(<NewTxFlow />, undefined, false)
  }

  // Loading state - show skeleton
  if (isLoading) {
    return (
      <Card className={css.banner}>
        <Stack direction={{ xs: 'column', md: 'row' }} alignItems={{ xs: 'flex-start', md: 'center' }} spacing={2}>
          <Box width={76} height={76} sx={{ bgcolor: 'grey.200', borderRadius: 1 }} />
          <Box flex={1}>
            <Box height={24} sx={{ bgcolor: 'grey.200', borderRadius: 1, mb: 1 }} />
            <Box height={20} sx={{ bgcolor: 'grey.200', borderRadius: 1, mb: 2 }} />
            <Box height={32} width={120} sx={{ bgcolor: 'grey.200', borderRadius: 1 }} />
          </Box>
        </Stack>
        <IconButton className={css.closeButton} aria-label="close" onClick={() => onDismiss(isEligible)}>
          <CloseIcon fontSize="small" color="border" />
        </IconButton>
      </Card>
    )
  }

  // Error state - show banner with error indicator
  if (error) {
    return (
      <Card className={css.banner}>
        <Stack direction={{ xs: 'column', md: 'row' }} alignItems={{ xs: 'flex-start', md: 'center' }} spacing={2}>
          <SafeCoinsIllustration />
          <Box>
            <Typography variant="h4" fontWeight="bold" color="static.main" className={css.bannerText}>
              Enjoy No Fee November
            </Typography>
            <Typography variant="body2" color="static.light" sx={{ pointerEvents: 'auto' }}>
              SAFE holders enjoy gasless transactions on Mainnet this November.{' '}
              <Link href="https://help.safe.global/en/" style={{ textDecoration: 'underline', fontWeight: 'bold' }}>
                Learn more
              </Link>
            </Typography>
            <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
              Unable to check eligibility
            </Typography>
          </Box>
        </Stack>
        <IconButton className={css.closeButton} aria-label="close" onClick={() => onDismiss(isEligible)}>
          <CloseIcon fontSize="small" color="border" />
        </IconButton>
      </Card>
    )
  }

  // Eligible state
  if (isEligible === true) {
    return (
      <Card className={css.banner}>
        <Stack direction={{ xs: 'column', md: 'row' }} alignItems={{ xs: 'flex-start', md: 'center' }} spacing={2}>
          <SafeCoinsIllustration />
          <Box>
            <Typography variant="h4" fontWeight="bold" color="static.main" className={css.bannerText}>
              Enjoy No Fee November
            </Typography>
            <Typography variant="body2" color="static.light" sx={{ pointerEvents: 'auto' }}>
              SAFE holders enjoy gasless transactions on Mainnet this November.{' '}
              <Link href="https://help.safe.global/en/" style={{ textDecoration: 'underline', fontWeight: 'bold' }}>
                Learn more
              </Link>
            </Typography>
            <Track {...{ category: 'overview', action: 'open_no_fee_november_new_tx' }}>
              <Button
                variant="contained"
                size="small"
                onClick={handleNewTransaction}
                sx={{
                  mt: 1,
                  bgcolor: 'static.main',
                  color: 'static.contrast',
                  '&:hover': { bgcolor: 'static.main' },
                }}
              >
                New transaction
              </Button>
            </Track>
          </Box>
        </Stack>
        <Track {...{ category: 'overview', action: 'hide_no_fee_november_banner' }}>
          <IconButton className={css.closeButton} aria-label="close" onClick={() => onDismiss(isEligible)}>
            <CloseIcon fontSize="small" color="border" />
          </IconButton>
        </Track>
      </Card>
    )
  }

  // Not eligible state
  return (
    <Card className={css.banner}>
      <Stack direction={{ xs: 'column', md: 'row' }} alignItems={{ xs: 'flex-start', md: 'center' }} spacing={2}>
        <SafeCoinsIllustration />
        <Box>
          <Typography variant="h4" fontWeight="bold" color="static.main" className={css.bannerText}>
            Enjoy No Fee November
          </Typography>
          <Typography variant="body2" color="static.light" sx={{ pointerEvents: 'auto' }}>
            SAFE holders enjoy gasless transactions on Mainnet this November.{' '}
            <Link href="https://help.safe.global/en/" style={{ textDecoration: 'underline', fontWeight: 'bold' }}>
              Learn more
            </Link>
          </Typography>

          {/* Info message with icon */}
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 1, mb: 2 }}>
            <InfoIcon fontSize="small" sx={{ color: 'static.light' }} />
            <Typography variant="caption" color="static.light">
              You don&apos;t hold any SAFE yet — get some to enjoy No Fee November.
            </Typography>
          </Stack>

          <Track {...{ category: 'overview', action: 'open_no_fee_november_get_safe' }}>
            <Link href={AppRoutes.swap && { pathname: AppRoutes.swap, query: { safe: router.query.safe } }} passHref>
              <Button
                variant="contained"
                size="small"
                sx={{
                  bgcolor: 'static.main',
                  color: 'static.contrast',
                  '&:hover': { bgcolor: 'static.main' },
                }}
              >
                Get SAFE token
              </Button>
            </Link>
          </Track>
        </Box>
      </Stack>
      <Track {...{ category: 'overview', action: 'hide_no_fee_november_banner' }}>
        <IconButton className={css.closeButton} aria-label="close" onClick={() => onDismiss(isEligible)}>
          <CloseIcon fontSize="small" color="border" />
        </IconButton>
      </Track>
    </Card>
  )
}

export default NoFeeNovemberBanner
