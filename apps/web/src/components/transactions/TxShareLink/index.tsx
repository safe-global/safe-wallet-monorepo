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

export function TxShareBlock({ txId }: { txId: string }) {
  return (
    <Box data-testid="share-block" display="flex" justifyContent="flex-end" className={css.shareBlock}>
      <TxShareLink id={txId} eventLabel={CopyDeeplinkLabels.shareBlock}>
        <Button
          data-testid="copy-link-btn"
          variant="neutral"
          startIcon={<SvgIcon component={ShareIcon} inheritViewBox fontSize="small" className={css.shareIcon} />}
        >
          Copy link
        </Button>
      </TxShareLink>
    </Box>
  )
}
