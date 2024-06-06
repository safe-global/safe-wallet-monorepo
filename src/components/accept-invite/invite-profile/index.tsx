import { Box, IconButton, Button, SvgIcon, Typography } from '@mui/material'
import React, { type SyntheticEvent } from 'react'
import css from './styles.module.css'
import NounsAvatar from '@/components/common/NounsAvatar'
import CopyAddressButton from '@/components/common/CopyAddressButton'
import { zeroAddress } from 'viem'
import ExplorerButton from '@/components/common/ExplorerButton'
import Trash from '@/public/images/common/trash.svg'

function InviteProfile({ onClick }: { onClick: () => void }) {
  const stopPropagation = (e: SyntheticEvent) => e.stopPropagation()

  return (
    <Box width="100%" className={css.container}>
      <Box display="flex" gap="8px" flexDirection="row" alignItems="flex-end">
        <Box className={css['avatar-container']}>
          <NounsAvatar
            seed={{
              accessory: 1,
              body: 1,
              background: 1,
              glasses: 1,
              head: 1,
            }}
          />
        </Box>
        <Box className={css['profile-info']}>
          <Typography className={css['profile-name']}>luuk.superchain</Typography>
          <Typography className={css['profile-address']}>oeth:0xD0be...051e</Typography>
        </Box>
        <Box className={css['actions-container']}>
          <CopyAddressButton address={zeroAddress} />
          <ExplorerButton onClick={stopPropagation} />
        </Box>
      </Box>

      <Box display="flex" gap="8px" flexDirection="row">
        <IconButton className={css.trashButton}>
          <SvgIcon component={Trash} inheritViewBox />
        </IconButton>
        <Button onClick={() => onClick} className={css.acceptButton} variant="contained">
          Accept
        </Button>
      </Box>
    </Box>
  )
}

export default InviteProfile
