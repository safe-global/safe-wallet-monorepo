import { Box, Button, SvgIcon } from '@mui/material'

import ShareIcon from '@/public/images/messages/link.svg'
import { CopyDeeplinkLabels } from '@/services/analytics'
import TxShareLink from './TxShareLink'
import { getBlockExplorerLink } from '@safe-global/utils/utils/chains'
import { useCurrentChain } from '@/hooks/useChains'
import ExplorerButton from '@/components/common/ExplorerButton'

import css from './styles.module.css'

export function TxExplorerLink({ txHash }: { txHash: string }) {
  const chain = useCurrentChain()
  const explorerLink = chain ? getBlockExplorerLink(chain, txHash) : undefined

  return (
    <Button variant="neutral" fullWidth>
      <ExplorerButton {...explorerLink} isCompact={false} fontSize="14px" />
    </Button>
  )
}

export function TxShareBlock({ txId, hasSigners = true }: { txId: string; hasSigners?: boolean }) {
  return (
    <Box
      data-testid="share-block"
      display="flex"
      justifyContent={hasSigners ? 'flex-end' : 'stretch'}
      className={hasSigners ? css.shareBlock : css.shareBlockStatic}
    >
      <TxShareLink id={txId} eventLabel={CopyDeeplinkLabels.shareBlock}>
        <Button
          data-testid="copy-link-btn"
          variant="neutral"
          fullWidth={!hasSigners}
          startIcon={<SvgIcon component={ShareIcon} inheritViewBox fontSize="small" className={css.shareIcon} />}
        >
          Copy link
        </Button>
      </TxShareLink>
    </Box>
  )
}
