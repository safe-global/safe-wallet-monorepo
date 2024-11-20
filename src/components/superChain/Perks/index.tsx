import { Box, Skeleton, SvgIcon, Tooltip, Typography } from '@mui/material'
import PerkRaffle from '@/public/images/superchain/perk-raffle.svg'
import PerkSponsored from '@/public/images/superchain/perk-gas.svg'
import React, { useMemo } from 'react'
import css from './styles.module.css'
import type { Perks } from '@/features/superChain/services/badges.service'

function Perks({ data, isLoading }: { data: Perks | undefined; isLoading: boolean }) {
  const perks = useMemo(() => {
    if (!data) {
      return {
        raffle: { value: 0 },
        sponsoredTxns: { value: 0 },
      }
    }
    return {
      raffle: {
        value: data.find((perk) => perk.name === 'SuperChainRaffle')?.value ?? 0,
      },
      sponsoredTxns: {
        value: data.find((perk) => perk.name === 'SponsoredTxns')?.value ?? 0,
      },
    }
  }, [data])

  return (
    <Box display="flex" width="100%" paddingTop="24px" flexDirection="column" gap="24px" flexWrap="wrap">
      {isLoading ? (
        <>
          <Skeleton variant="rounded" width="100%" height={40} />
          <Skeleton variant="rounded" width="100%" height={40} />
          <Skeleton variant="rounded" width="100%" height={40} />
        </>
      ) : (
        <>
          <Box
            display="flex"
            width="100%"
            flexDirection="row"
            justifyContent="flex-start"
            gap="12px"
            alignItems="center"
          >
            <Tooltip title={<Typography align="center">SuperChain Raffle</Typography>}>
              <Box display="flex" justifyContent="center" alignItems="center">
                <SvgIcon component={PerkRaffle} inheritViewBox className={css.perk} />
              </Box>
            </Tooltip>
            <Typography
              fontSize={16}
              border={1}
              borderColor="secondary.main"
              borderRadius="6px"
              padding="12px"
              width="100%"
            >
              Claim {perks.raffle?.value ?? 0} tickets per week
            </Typography>
          </Box>

          <Box
            display="flex"
            width="100%"
            flexDirection="row"
            justifyContent="flex-start"
            gap="12px"
            alignItems="center"
          >
            <Tooltip title={<Typography align="center">Sponsored Transactions</Typography>}>
              <Box display="flex" justifyContent="center" alignItems="center">
                <SvgIcon component={PerkSponsored} inheritViewBox className={css.perk} />
              </Box>
            </Tooltip>
            <Typography
              fontSize={16}
              border={1}
              borderColor="secondary.main"
              borderRadius="6px"
              padding="12px"
              width="100%"
            >
              {perks.sponsoredTxns?.value ?? 0} Sponsored Transactions per week
            </Typography>
          </Box>
        </>
      )}
    </Box>
  )
}

export default Perks
