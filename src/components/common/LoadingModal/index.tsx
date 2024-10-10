import { Box, Dialog, Stack, SvgIcon, Typography } from '@mui/material'
import React from 'react'
import SuperChainStart from '@/public/images/common/superchain-star.svg'
import css from './styles.module.css'
import { getBlockExplorerLink } from '@/utils/chains'
import { useCurrentChain } from '@/hooks/useChains'
import ExplorerButton from '@/components/common/ExplorerButton'
import LinkIconBold from '@/public/images/sidebar/link-bold.svg'

function LoadingModal({ open, title, hash }: { open: boolean; title: string; hash?: string }) {
  const chain = useCurrentChain()
  const blockExplorerLink = chain && hash ? getBlockExplorerLink(chain, hash) : undefined

  return (
    <Dialog className={css.container} open={open} onClose={() => {}}>
      <Box
        display="flex"
        flexDirection="column"
        gap="20px"
        padding="36px 24px 36px 24px"
        justifyContent="center"
        alignItems="center"
        fontSize="64px"
      >
        <Typography fontSize={24} fontWeight={600}>
          {title}
        </Typography>
        <SvgIcon className={css.spin} component={SuperChainStart} inheritViewBox fontSize="inherit" />
        {hash && (
          <Stack direction="row" spacing={1} alignItems="center" justifyContent="center" fontSize={12} color="GrayText">
            <Typography color="GrayText">View on explorer</Typography>
            <ExplorerButton {...blockExplorerLink} icon={LinkIconBold} fontSize="inherit" color="inherit" />
          </Stack>
        )}
      </Box>
    </Dialog>
  )
}

export default LoadingModal
