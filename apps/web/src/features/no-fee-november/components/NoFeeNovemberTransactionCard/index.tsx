import React from 'react'
import { Box, Card, Stack, Typography } from '@mui/material'
import SafeCoinsIllustration from '@/components/common/SafeCoinsIllustration'
import css from './styles.module.css'
import Link from 'next/link'
import useNoFeeNovemberEligibility from '@/features/no-fee-november/hooks/useNoFeeNovemberEligibility'
import InfoIcon from '@mui/icons-material/Info'

const NoFeeNovemberTransactionCard = () => {
  const { isEligible, isLoading, error } = useNoFeeNovemberEligibility()

  // Loading state - show skeleton
  if (isLoading) {
    return (
      <Card className={css.card}>
        <Stack direction="row" alignItems="center" spacing={3}>
          <Box className={css.skeletonIcon} />
          <Box flex={1}>
            <Box className={`${css.skeletonBox} ${css.skeletonTitle}`} />
            <Box className={`${css.skeletonBox} ${css.skeletonSubtitle}`} />
          </Box>
        </Stack>
      </Card>
    )
  }

  // Error state - show eligible content (fail gracefully)
  if (error) {
    return (
      <Card className={css.card}>
        <Stack direction="row" alignItems="center" spacing={3}>
          <Box className={css.iconContainer}>
            <SafeCoinsIllustration />
          </Box>
          <Box flex={1}>
            <Typography variant="subtitle2" fontWeight="bold" color="static.main" className={css.title}>
              Enjoy No Fee November
            </Typography>
            <Typography variant="body2" color="static.light" className={css.description}>
              SAFE holders enjoy gasless transactions on Mainnet this November.{' '}
              <Link href="https://help.safe.global/en/" style={{ textDecoration: 'underline', fontWeight: 'bold' }}>
                Learn more
              </Link>
            </Typography>
          </Box>
        </Stack>
      </Card>
    )
  }

  // Eligible state (from Figma design)
  if (isEligible === true) {
    return (
      <Card className={css.card}>
        <Stack direction="row" alignItems="center" spacing={3}>
          <Box className={css.iconContainer}>
            <SafeCoinsIllustration />
          </Box>
          <Box flex={1}>
            <Typography variant="subtitle2" fontWeight="bold" color="static.main" className={css.title}>
              Enjoy No Fee November
            </Typography>
            <Typography variant="body2" color="static.light" className={css.description}>
              SAFE holders enjoy gasless transactions on Mainnet this November.{' '}
              <Link href="https://help.safe.global/en/" style={{ textDecoration: 'underline', fontWeight: 'bold' }}>
                Learn more
              </Link>
            </Typography>
          </Box>
        </Stack>
      </Card>
    )
  }

  // Not eligible state (from banner in assets/home, without Get SAFE button)
  return (
    <Card className={css.card}>
      <Stack direction="row" alignItems="center" spacing={3}>
        <Box className={css.iconContainer}>
          <SafeCoinsIllustration />
        </Box>
        <Box flex={1}>
          <Typography variant="subtitle2" fontWeight="bold" color="static.main" className={css.title}>
            Enjoy No Fee November
          </Typography>
          <Typography variant="body2" color="static.light" className={css.description}>
            SAFE holders enjoy gasless transactions on Mainnet this November.{' '}
            <Link href="https://help.safe.global/en/" style={{ textDecoration: 'underline', fontWeight: 'bold' }}>
              Learn more
            </Link>
          </Typography>

          {/* Info message with icon */}
          <Stack direction="row" alignItems="center" spacing={1} className={css.infoStack}>
            <InfoIcon fontSize="small" className={css.infoIcon} />
            <Typography variant="caption" color="static.light">
              You don&apos;t hold any SAFE yet — get some to enjoy No Fee November.
            </Typography>
          </Stack>
        </Box>
      </Stack>
    </Card>
  )
}

export default NoFeeNovemberTransactionCard
