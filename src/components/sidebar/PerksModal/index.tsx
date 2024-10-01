import ModalDialog from '@/components/common/ModalDialog'
import { Box, CircularProgress, DialogContent, Skeleton, SvgIcon, Tooltip, Typography } from '@mui/material'
import React, { useMemo } from 'react'
import css from './styles.module.css'
import PerkRaffle from '@/public/images/superchain/perk-raffle.svg'
import PerkRebate from '@/public/images/superchain/perk-rebate.svg'
import PerkCashback from '@/public/images/superchain/perk-cashback.svg'
import useCurrentPerks from '@/hooks/super-chain/useCurrentPerks'

function PerksModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data, isLoading } = useCurrentPerks()

  const perks = useMemo(() => {
    console.debug('data', data)
    if (!data) {
      return {
        raffle: { value: 0 },
      }
    }
    return {
      raffle: {
        value: data.find((perk) => perk.name === 'SuperChainRaffle')?.value ?? 0,
      },
    }
  }, [data])

  return (
    <ModalDialog
      maxWidth="xs"
      open={open}
      hideChainIndicator
      dialogTitle={
        <Typography fontSize={24} fontWeight={600}>
          Current Perks
        </Typography>
      }
      onClose={onClose}
    >
      <DialogContent>
        <Box display="flex" width="100%" paddingTop="24px" flexDirection="column" gap="24px" flexWrap="wrap">
          {isLoading ? (
            <>
              <Skeleton variant="rounded" width="100%" height={100} />
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
                <Tooltip title={<Typography align="center">Mook Toltip</Typography>}>
                  <Box display="flex" justifyContent="center" alignItems="center">
                    <SvgIcon component={PerkRebate} inheritViewBox className={css.perk} />
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
                  50% Rebate on fees
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
                <Tooltip title={<Typography align="center">Mook Toltip</Typography>}>
                  <Box display="flex" justifyContent="center" alignItems="center">
                    <SvgIcon component={PerkCashback} inheritViewBox className={css.perk} />
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
                  1% Cashback on fees
                </Typography>
              </Box>
            </>
          )}
        </Box>
      </DialogContent>
    </ModalDialog>
  )
}

export default PerksModal
