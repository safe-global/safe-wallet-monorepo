import { type ReactElement } from 'react'
import ExplorerButton from '@/components/common/ExplorerButton'
import { useCurrentChain } from '@/hooks/useChains'
import { getBlockExplorerLink } from '@safe-global/utils/utils/chains'
import { Typography } from '@mui/material'

const ExplorerLink = ({ address }: { address: string }): ReactElement | null => {
  const currentChain = useCurrentChain()
  const link = currentChain ? getBlockExplorerLink(currentChain, address) : undefined

  if (!link) return null

  return (
    <Typography component="span" color="border.main">
      <ExplorerButton href={link.href} title={link.title} />
    </Typography>
  )
}

export default ExplorerLink
