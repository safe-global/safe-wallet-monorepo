import { Box, IconButton, Button, SvgIcon, Typography } from '@mui/material'
import React, { type SyntheticEvent } from 'react'
import css from './styles.module.css'
import NounsAvatar from '@/components/common/NounsAvatar'
import CopyAddressButton from '@/components/common/CopyAddressButton'
import { type Address, zeroAddress } from 'viem'
import ExplorerButton from '@/components/common/ExplorerButton'
import Trash from '@/public/images/common/trash.svg'
import { shortenAddress } from '@/utils/formatters'
import useWallet from '@/hooks/wallets/useWallet'
import { type PendingEOASRequest } from '@/hooks/super-chain/usePendingEOASRequests'

function InviteProfile({
  onClick,
  population,
}: {
  onClick: (safe: Address, newOwner: Address, superChainId: string) => void
  population: PendingEOASRequest['ownerPopulateds'][0]
}) {
  const stopPropagation = (e: SyntheticEvent) => e.stopPropagation()
  const wallet = useWallet()
  return (
    <Box width="100%" className={css.container}>
      <Box display="flex" gap="8px" flexDirection="row" alignItems="flex-end">
        <Box className={css['avatar-container']}>
          <NounsAvatar
            seed={{
              accessory: population.superChainSmartAccount.noun_accessory,
              body: population.superChainSmartAccount.noun_body,
              background: population.superChainSmartAccount.noun_background,
              glasses: population.superChainSmartAccount.noun_glasses,
              head: population.superChainSmartAccount.noun_head,
            }}
          />
        </Box>
        <Box className={css['profile-info']}>
          <Typography className={css['profile-name']}>{population.superChainId}</Typography>
          <Typography className={css['profile-address']}>oeth:{shortenAddress(population.safe, 4)}</Typography>
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
        <Button
          onClick={() => onClick(population.safe, wallet!.address as Address, population.superChainId)}
          className={css.acceptButton}
          variant="contained"
        >
          Accept
        </Button>
      </Box>
    </Box>
  )
}

export default InviteProfile
