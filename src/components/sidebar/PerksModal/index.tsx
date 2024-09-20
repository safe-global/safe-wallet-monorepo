import ModalDialog from '@/components/common/ModalDialog'
import { Box, DialogContent, SvgIcon, Tooltip, Typography } from '@mui/material'
import React from 'react'
import css from './styles.module.css'
import PerkRaffle from '@/public/images/superchain/perk-raffle.svg'
import PerkRebate from '@/public/images/superchain/perk-rebate.svg'
import PerkCashback from '@/public/images/superchain/perk-cashback.svg'

function PerksModal({ open, onClose }: { open: boolean; onClose: () => void }) {
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
      <DialogContent style={{ paddingTop: '24px !important' }}>
        <Box display="flex" width="100%" flexDirection="column" gap="24px" flexWrap="wrap">
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
              Claim 5 tickets per week
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
        </Box>
      </DialogContent>
    </ModalDialog>
  )
}

export default PerksModal
