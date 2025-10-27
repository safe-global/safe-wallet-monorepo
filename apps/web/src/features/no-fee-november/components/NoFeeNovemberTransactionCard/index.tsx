import React from 'react'
import { Box, Card, Stack, Typography, IconButton } from '@mui/material'
import Image from 'next/image'
import css from './styles.module.css'
import Link from 'next/link'
import CloseIcon from '@mui/icons-material/Close'
import useNoFeeNovemberEligibility from '@/features/no-fee-november/hooks/useNoFeeNovemberEligibility'
import BlockedAddress from '@/components/common/BlockedAddress'

const NoFeeNovemberTransactionCard = () => {
  const { isEligible, isLoading, error, blockedAddress } = useNoFeeNovemberEligibility()

  // Blocked address state - show blocked message (matches Earn pattern)
  if (blockedAddress) {
    return (
      <Stack
        direction="column"
        sx={{
          alignItems: 'center',
          justifyContent: 'center',
          flex: 1,
        }}
      >
        <BlockedAddress address={blockedAddress} featureTitle="No Fee November" />
      </Stack>
    )
  }

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
            <Image
              src="/images/common/no-fee-november/Cards.svg"
              alt="No Fee November Cards"
              width={48}
              height={48}
              className={css.cardsImage}
            />
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
        <Box className={css.cardContent}>
          {/* Close button */}
          <IconButton className={css.closeButton} aria-label="close">
            <CloseIcon fontSize="small" />
          </IconButton>

          {/* Main content */}
          <Box className={css.mainContent}>
            {/* Title and eligibility tag inline */}
            <Box className={css.titleRow}>
              <Typography variant="subtitle2" fontWeight="bold" className={css.title}>
                Enjoy No-Fee November
              </Typography>
              <Box className={css.eligibilityTag}>
                <Image
                  src="/images/common/no-fee-november/check-icon.svg"
                  alt="Eligible"
                  width={16}
                  height={16}
                  className={css.tagIcon}
                />
                <Typography variant="caption" className={css.tagText}>
                  You are eligible
                </Typography>
              </Box>
            </Box>

            {/* Description */}
            <Typography variant="body2" className={css.description}>
              SAFE holders enjoy gasless transactions on Ethereum Mainnet this November.{' '}
              <Link href="https://help.safe.global/en/" style={{ textDecoration: 'underline', fontWeight: 'bold' }}>
                Learn more
              </Link>
            </Typography>
          </Box>

          {/* Coins illustration */}
          <Box className={css.coinsContainer}>
            <Image
              src="/images/common/no-fee-november/Cards.svg"
              alt="No Fee November Cards"
              width={58}
              height={58}
              className={css.coinsImage}
            />
          </Box>
        </Box>
      </Card>
    )
  }

  // Not eligible state (from banner in assets/home, without Get SAFE button)
  return null
}

export default NoFeeNovemberTransactionCard
