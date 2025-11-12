import { Box, Button, SvgIcon } from '@mui/material'

import ShareIcon from '@/public/images/messages/link.svg'
import { CopyDeeplinkLabels } from '@/services/analytics'
import TxShareLink from './TxShareLink'

import css from './styles.module.css'
import { getBlockExplorerLink } from '@safe-global/utils/utils/chains'
import { useCurrentChain } from '@/hooks/useChains'
import ExplorerButton from '@/components/common/ExplorerButton'

export function TxExplorerLink({ txHash }: { txHash: string }) {
  const chain = useCurrentChain()
  const explorerLiknk = chain ? getBlockExplorerLink(chain, txHash) : undefined

  return (
    <Button variant="outlined" fullWidth className={css.explorerButton}>
      <ExplorerButton {...explorerLiknk} isCompact={false} fontSize="14px" />
    </Button>
  )
}

export function TxShareBlock({ txId }: { txId: string }) {
  return (
    <Box data-testid="share-block" display="flex" justifyContent="flex-end" className={css.shareBlock}>
      <TxShareLink id={txId} eventLabel={CopyDeeplinkLabels.shareBlock}>
        <Button
          data-testid="copy-link-btn"
          variant="outlined"
          startIcon={<SvgIcon component={ShareIcon} inheritViewBox fontSize="small" />}
          className={css.copyButton}
        >
          Copy link
        </Button>
      </TxShareLink>
    </Box>
  )
}
