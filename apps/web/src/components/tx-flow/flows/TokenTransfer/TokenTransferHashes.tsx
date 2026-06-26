import { useContext, useEffect, useState } from 'react'
import { Box, Button, Divider, Paper, Stack, Typography } from '@mui/material'
import type { SafeTransaction } from '@safe-global/types-kit'
import { HexEncodedData } from '@/components/transactions/HexEncodedData'
import { SafeTxContext } from '../../SafeTxProvider'
import { TxFlowContext } from '../../TxFlowProvider'
import TokenTransferDetailsModal from './TokenTransferDetailsModal'
import {
  useDomainHash,
  useMessageHash,
  useSafeTxHash,
} from '@/components/transactions/TxDetails/Summary/SafeTxHashDataRow'

const HashRow = ({ label, value }: { label: string; value?: string | null }) =>
  value ? (
    <Box>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
        <HexEncodedData hexData={value} limit={66} highlightFirstBytes={false} />
      </Typography>
    </Box>
  ) : null

/**
 * Inner panel — only mounted once a safeTx exists, so the hash hooks always receive defined
 * safeTxData (rules of hooks: no conditional hook calls).
 */
const HashesPanel = ({ safeTxData }: { safeTxData: SafeTransaction['data'] }) => {
  const safeTxHash = useSafeTxHash({ safeTxData })
  const domainHash = useDomainHash()
  const messageHash = useMessageHash({ safeTxData })
  const { isSubmitLoading } = useContext(TxFlowContext)
  const [detailsOpen, setDetailsOpen] = useState(false)

  // Auto-open the details while the user is signing/executing (to verify against their wallet),
  // and close them again once the submission finishes or is rejected.
  useEffect(() => {
    setDetailsOpen(isSubmitLoading)
  }, [isSubmitLoading])

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="overline" color="text.secondary">
        Hashes
      </Typography>
      <Stack spacing={1} divider={<Divider />} mt={1}>
        <HashRow label="safeTxHash" value={safeTxHash} />
        <HashRow label="Domain hash" value={domainHash} />
        <HashRow label="Message hash" value={messageHash} />
      </Stack>

      <Button
        variant="text"
        size="small"
        onClick={() => setDetailsOpen(true)}
        data-testid="tx-details-btn"
        sx={{ mt: 1 }}
      >
        Transaction details
      </Button>

      {detailsOpen && <TokenTransferDetailsModal safeTxData={safeTxData} onClose={() => setDetailsOpen(false)} />}
    </Paper>
  )
}

/**
 * Live hashes panel for the single-screen token transfer. Rendered into the sidebar slot, it sits
 * directly under the SafeShield widget and refreshes whenever the safeTx in context is rebuilt.
 */
export const TokenTransferHashes = () => {
  const { safeTx } = useContext(SafeTxContext)

  if (!safeTx) return null

  return <HashesPanel safeTxData={safeTx.data} />
}

export default TokenTransferHashes
