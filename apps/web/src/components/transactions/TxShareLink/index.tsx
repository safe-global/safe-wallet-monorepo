import { Box, Button, SvgIcon } from '@mui/material'

import ShareIcon from '@/public/images/messages/link.svg'
import { CopyDeeplinkLabels } from '@/services/analytics'
import TxShareLink from './TxShareLink'

import css from './styles.module.css'
import { getBlockExplorerLink } from '@safe-global/utils/utils/chains'
import { useCurrentChain } from '@/hooks/useChains'
import ExplorerButton from '@/components/common/ExplorerButton'

function ExplorerLink({ txHash }: { txHash: string }) {
  const chain = useCurrentChain()
  const explorerLiknk = chain ? getBlockExplorerLink(chain, txHash) : undefined

  return (
    <Button variant="text" size="compact" className={css.button}>
      <ExplorerButton {...explorerLiknk} isCompact={false} fontSize="14px" />
    </Button>
  )
}

export function TxShareBlock({ txId, txHash }: { txId: string; txHash?: string | null }) {
  return (
    <Box data-testid="share-block" display="flex" justifyContent="flex-end" className={css.shareBlock}>
      <TxShareLink id={txId} eventLabel={CopyDeeplinkLabels.shareBlock}>
        <Button
          data-testid="copy-link-btn"
          variant="outlined"
          size="compact"
          startIcon={<SvgIcon component={ShareIcon} inheritViewBox fontSize="small" />}
          className={css.button}
        >
          Copy link
        </Button>
      </TxShareLink>

      {txHash && <ExplorerLink txHash={txHash} />}
    </Box>
  )
}
