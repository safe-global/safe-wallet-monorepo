import { Box, IconButton, Button, SvgIcon, Typography } from '@mui/material'
import React, { type SyntheticEvent } from 'react'
import css from './styles.module.css'
import NounsAvatar from '@/components/common/NounsAvatar'
import CopyAddressButton from '@/components/common/CopyAddressButton'
import { type Address, zeroAddress } from 'viem'
import ExplorerButton from '@/components/common/ExplorerButton'
import Trash from '@/public/images/common/trash.svg'
import { shortenAddress } from '@/utils/formatters'
import useSuperChainAccount from '@/hooks/super-chain/useSuperChainAccount'
import useWallet from '@/hooks/wallets/useWallet'

function InviteProfile({ onClick, safe, superChainId }: { onClick: () => void; safe: Address; superChainId: string }) {
  const stopPropagation = (e: SyntheticEvent) => e.stopPropagation()
  const { getWriteableSuperChainSmartAccount } = useSuperChainAccount()
  const wallet = useWallet()

  const handleAcceptInvitation = async () => {
    const superChainSmartAccountContract = getWriteableSuperChainSmartAccount()
    await superChainSmartAccountContract?.write.addOwnerWithThreshold([safe, wallet?.address])
    onClick()
  }

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
          <Typography className={css['profile-name']}>{superChainId}</Typography>
          <Typography className={css['profile-address']}>oeth:{shortenAddress(safe, 4)}</Typography>
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
        <Button onClick={handleAcceptInvitation} className={css.acceptButton} variant="contained">
          Accept
        </Button>
      </Box>
    </Box>
  )
}

export default InviteProfile
