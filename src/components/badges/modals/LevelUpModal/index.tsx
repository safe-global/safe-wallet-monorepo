import React, { useMemo } from 'react'
import { Box, Button, Dialog, Skeleton, SvgIcon, Typography } from '@mui/material'
import css from './styles.module.css'
import Tooltip from '@mui/material/Tooltip'

import PerkRaffle from '@/public/images/superchain/perk-raffle.svg'
import PerkRebate from '@/public/images/superchain/perk-rebate.svg'
import PerkCashback from '@/public/images/superchain/perk-cashback.svg'
import StarAnimation from '../StarsAnimation'
import { useQuery } from '@tanstack/react-query'
import badgesService from '@/features/superChain/services/badges.service'
function LevelUpModal({ open, onClose, level }: { open: boolean; onClose: () => void; level: number }) {
  const { data, isLoading } = useQuery({
    queryKey: ['lyvelUpModal'],
    queryFn: async () => badgesService.getPerksByLevel(level),
  })
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
    <>
      <Dialog
        className={css.claimModal}
        open={open}
        onClose={onClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box
          display="flex"
          flexDirection="column"
          gap="24px"
          padding="36px 24px 36px 24px"
          justifyContent="center"
          alignItems="center"
        >
          <Box gap="12px" display="flex" flexDirection="column" justifyContent="center" alignItems="center">
            <Typography id="modal-modal-title" fontSize={24} fontWeight={600} component="h2">
              You’ve reached level {level}!
            </Typography>
            <Typography color="GrayText" id="modal-modal-description" fontSize={16}>
              You have unlocked the following perks:
            </Typography>
          </Box>
          {isLoading ? (
            <>
              <Skeleton variant="rounded" width="100%" height={40} />
              <Skeleton variant="rounded" width="100%" height={40} />
              <Skeleton variant="rounded" width="100%" height={40} />
            </>
          ) : (
            <>
              <Box display="flex" width="80%" flexDirection="column" gap="24px" flexWrap="wrap">
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
              </Box>
            </>
          )}
        </Box>
        <Button onClick={onClose} variant="contained" className={css.outsideButton}>
          Return to Dashboard
        </Button>
        <StarAnimation />
      </Dialog>
    </>
  )
}

export default LevelUpModal
