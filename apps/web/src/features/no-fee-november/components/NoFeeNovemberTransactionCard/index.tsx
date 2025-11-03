import React from 'react'
import { Box, Card, Stack, Typography } from '@mui/material'
import Image from 'next/image'
import css from './styles.module.css'
import Link from 'next/link'
import useNoFeeNovemberEligibility from '@/features/no-fee-november/hooks/useNoFeeNovemberEligibility'
import useIsNoFeeNovemberFeatureEnabled from '@/features/no-fee-november/hooks/useIsNoFeeNovemberFeatureEnabled'
import BlockedAddress from '@/components/common/BlockedAddress'
import { useDarkMode } from '@/hooks/useDarkMode'

const NoFeeNovemberTransactionCard = () => {
  const isEnabled = useIsNoFeeNovemberFeatureEnabled()
  const { isEligible, isLoading, error, blockedAddress } = useNoFeeNovemberEligibility()
  const dark = useDarkMode()

  if (!isEnabled) {
    return null
  }

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
        <BlockedAddress address={blockedAddress} featureTitle="No-Fee November" />
      </Stack>
    )
  }

  // Loading state - show skeleton
  if (isLoading) {
    return (
      <div className={dark ? css.dark : undefined}>
        <Card className={css.card}>
          <Stack direction="row" alignItems="center" spacing={3}>
            <Box className={css.skeletonIcon} />
            <Box flex={1}>
              <Box className={`${css.skeletonBox} ${css.skeletonTitle}`} />
              <Box className={`${css.skeletonBox} ${css.skeletonSubtitle}`} />
            </Box>
          </Stack>
        </Card>
      </div>
    )
  }

  // Error state - show eligible content (fail gracefully)
  if (error) {
    return (
      <div className={dark ? css.dark : undefined}>
        <Card className={css.card}>
          <Stack direction="row" alignItems="center" spacing={3}>
            <Box className={css.iconContainer}>
              <Image
                src="/images/common/no-fee-november/Cards.svg"
                alt="No-Fee November Cards"
                width={48}
                height={48}
                className={css.cardsImage}
              />
            </Box>
            <Box flex={1}>
              <Typography variant="subtitle2" fontWeight="bold" color="static.main" className={css.title}>
                Enjoy No-Fee November
              </Typography>
              <Typography variant="body2" color="static.light" className={css.description}>
                SAFE holders enjoy gasless transactions on Mainnet this November.{' '}
                <Link
                  href="https://help.safe.global/en/articles/456540-no-fee-november"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: 'underline', fontWeight: 'bold' }}
                >
                  Learn more
                </Link>
              </Typography>
            </Box>
          </Stack>
        </Card>
      </div>
    )
  }

  // Eligible state
  if (isEligible === true) {
    return (
      <div className={dark ? css.dark : undefined}>
        <Card className={css.card}>
          <Box className={css.cardContent}>
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
                <Link
                  href="https://help.safe.global/en/articles/456540-no-fee-november"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: 'underline', fontWeight: 'bold' }}
                >
                  Learn more
                </Link>
              </Typography>
            </Box>

            {/* Coins illustration */}
            <Box className={css.coinsContainer}>
              <Image
                src="/images/common/no-fee-november/Cards.svg"
                alt="No-Fee November Cards"
                width={58}
                height={58}
                className={css.coinsImage}
              />
            </Box>
          </Box>
        </Card>
      </div>
    )
  }

  // Not eligible state
  return null
}

export default NoFeeNovemberTransactionCard
