import { Box, Grid, Paper, Stack, SvgIcon, Typography } from '@mui/material'
import React from 'react'
import css from './styles.module.css'
import PerkRaffle from '@/public/images/superchain/perk-raffle.svg'
import SuperChainEcoStamp from '@/public/images/common/superchain-eco-stamp.svg'
import Hearth from '@/public/images/common/hearth.svg'
import { SafeAppData } from '@safe-global/safe-gateway-typescript-sdk'
import { useAppSelector } from '@/store'
import { selectSuperChainAccount } from '@/store/superChainAccountSlice'

function SuperChainApp({
  handleClick,
  safeApp,
}: {
  handleClick: (safeApp: SafeAppData) => void
  safeApp: SafeAppData
}) {
  const superChainSmartAccount = useAppSelector(selectSuperChainAccount)

  return (
    <Grid item xs={12} sm={6} md={4} xl={4}>
      <Paper onClick={() => handleClick(safeApp)} className={css.container}>
        <Stack padding="24px" gap="12px" justifyContent="space-between" display="flex" height="100%" direction="column">
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Stack direction="row" gap="12px" justifyContent="flex-start" alignItems="center" fontSize="42px">
              <SvgIcon fontSize="inherit" component={PerkRaffle} inheritViewBox />
              <Typography fontWeight={600} fontSize={16}>
                Superchain Raffle
              </Typography>
            </Stack>
            <Stack direction="row" gap={1}>
              <SvgIcon component={SuperChainEcoStamp} inheritViewBox />
              <SvgIcon component={Hearth} inheritViewBox />
            </Stack>
          </Box>
          <Box display="flex" gap={1} alignItems="center">
            <Box
              className={css.categoryContainer}
              display="flex"
              fontWeight={400}
              fontSize={14}
              alignItems="center"
              justifyContent="center"
              padding="6px 12px "
              borderRadius="6px"
            >
              DeFi
            </Box>
            <Box
              className={css.categoryContainer}
              display="flex"
              fontWeight={400}
              fontSize={14}
              alignItems="center"
              justifyContent="center"
              padding="6px 12px"
              borderRadius="6px"
            >
              Gaming
            </Box>
          </Box>
          <Box>
            <Typography fontWeight={400} fontSize={14} color="GrayText">
              Lorem Ipsum is simply dummy text of the printing and typesetting industry.
            </Typography>
          </Box>

          <Box>
            <div className={css.currentLevelTitle}>
              <Typography fontWeight={600} fontSize={14} color="white">
                Current Level Perk
              </Typography>
            </div>
            <div className={css.currentLevelInfo}>
              <Typography>
                Claim{' '}
                {`${Number(superChainSmartAccount.data.level)} ${
                  Number(superChainSmartAccount.data.level) > 1 ? 'tickets' : 'ticket'
                }`}{' '}
                per week
              </Typography>
            </div>
          </Box>
        </Stack>
      </Paper>
    </Grid>
  )
}

export default SuperChainApp
