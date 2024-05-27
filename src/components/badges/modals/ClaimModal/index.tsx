import { Box, Button, Dialog, SvgIcon, Typography } from '@mui/material'
import React from 'react'
import Shiny from '@/public/images/common/shiny-animation.svg'
import SuperChainPoints from '@/public/images/common/superChain.svg'
import css from './styles.module.css'
import type { ClaimData } from '../../actions'
function ClaimModal({
  open,
  onClose,
  data,
  onLevelUp,
}: {
  open: boolean
  onClose: () => void
  data: ClaimData | null
  onLevelUp: () => void
}) {
  return (
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
            Claim success
          </Typography>
          <Typography color="GrayText" id="modal-modal-description" fontSize={16}>
            You have received the following rewards
          </Typography>
        </Box>
        <Box display="flex" gap="24px" flexWrap="wrap" maxWidth="360px">
          {data?.claimedBadges.map((badge, index) => (
            <img key={index} src={badge} alt="Badge" />
          ))}
        </Box>
        <Box
          className={css.pointsBox}
          display="flex"
          gap="6px"
          justifyContent="center"
          alignItems="center"
          padding="8px 14px 8px 16px"
        >
          <strong>{data?.totalPoints}</strong>
          <SvgIcon component={SuperChainPoints} inheritViewBox fontSize="medium" />
        </Box>
        <Typography color="GrayText" fontSize={16}>
          You still need <strong> 40 SC Point to level-up</strong>
        </Typography>
      </Box>
      {data?.isLevelUp ? (
        <button onClick={onLevelUp} className={css.levelUpButton}>
          Level-up
          <Shiny className={css.shine} />
        </button>
      ) : (
        <Button onClick={onClose} variant="contained" className={css.outsideButton}>
          Continue
        </Button>
      )}
    </Dialog>
  )
}

export default ClaimModal
