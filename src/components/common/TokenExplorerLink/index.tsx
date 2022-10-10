import { type ReactElement } from 'react'
import { IconButton, Tooltip, SvgIcon } from '@mui/material'
import { useCurrentChain } from '@/hooks/useChains'
import LinkIcon from '@/public/images/sidebar/link.svg'
import { getBlockExplorerLink } from '@/utils/chains'

const ExplorerLink = ({ address }: { address: string }): ReactElement | null => {
  const currentChain = useCurrentChain()
  const link = currentChain ? getBlockExplorerLink(currentChain, address) : undefined

  if (!link) return null

  return (
    <Tooltip title={link.title} placement="top">
      <IconButton href={link.href} target="_blank" rel="noopener noreferrer" size="small">
        <SvgIcon
          component={LinkIcon}
          inheritViewBox
          color="primary"
          fontSize="small"
          sx={{
            '& path': {
              fill: ({ palette }) => palette.border.main,
            },
          }}
        />
      </IconButton>
    </Tooltip>
  )
}

export default ExplorerLink
