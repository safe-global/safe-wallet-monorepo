import type { ReactNode } from 'react'
import { Alert, AlertTitle, Box, Divider, Stack, Typography } from '@mui/material'
import semverSatisfies from 'semver/functions/satisfies'
import { useCurrentChain } from '@/hooks/useChains'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useQueuedTxsLength } from '@/hooks/useTxQueue'
import ExternalLink from '@/components/common/ExternalLink'
import { maybePlural } from '@/utils/formatters'
import madProps from '@/utils/mad-props'
import { type TransactionData } from '@safe-global/safe-gateway-typescript-sdk'
import { extractTargetVersionFromUpdateSafeTx } from '@/services/tx/safeUpdateParams'

const QUEUE_WARNING_VERSION = '<1.3.0'

function BgBox({ children, light, warning }: { children: ReactNode; light?: boolean; warning?: boolean }) {
  const bgcolor = warning ? 'warning.background' : light ? 'background.light' : 'border.background'
  return (
    <Box flex={1} bgcolor={bgcolor} p={2} textAlign="center" fontWeight={700} fontSize={18} borderRadius={1}>
      {children}
    </Box>
  )
}

export function _UpdateSafe({
  safeInfo,
  queueSize,
  chain,
  txData,
}: {
  safeInfo: ReturnType<typeof useSafeInfo>
  queueSize: string
  chain: ReturnType<typeof useCurrentChain>
  txData: TransactionData | undefined
}) {
  const { safe } = safeInfo
  if (!safe.version) {
    return null
  }
  const showQueueWarning = queueSize && semverSatisfies(safe.version, QUEUE_WARNING_VERSION)
  const newVersion = extractTargetVersionFromUpdateSafeTx(txData, safe)

  return (
    <>
      <Stack direction="row" alignItems="center" spacing={2}>
        <BgBox>Current version: {safe.version}</BgBox>
        <Box fontSize={28}>→</Box>
        {newVersion !== undefined ? (
          <BgBox light>
            New version: {newVersion} {chain?.l2 ? '+L2' : ''}
          </BgBox>
        ) : (
          <BgBox warning>Unknown contract</BgBox>
        )}
      </Stack>
      {newVersion !== undefined ? (
        <Typography>
          Read about the updates in the new Safe contracts version in the{' '}
          <ExternalLink href={`https://github.com/safe-global/safe-contracts/releases/tag/v${newVersion}`}>
            version {newVersion} changelog
          </ExternalLink>
        </Typography>
      ) : (
        <Alert severity="error">
          <AlertTitle sx={{ fontWeight: 700 }}>Unknown contract</AlertTitle>
          The target contract for this upgrade is unknown. Verify the transaction data and the target contract address
          before executing this transaction.
        </Alert>
      )}

      {showQueueWarning && (
        <Alert severity="warning">
          <AlertTitle sx={{ fontWeight: 700 }}>This upgrade will invalidate all queued transactions!</AlertTitle>
          You have {queueSize} unexecuted transaction{maybePlural(parseInt(queueSize))}. Please make sure to execute or
          delete them before upgrading, otherwise you&apos;ll have to reject or replace them after the upgrade.
        </Alert>
      )}

      <Divider sx={{ my: 1, mx: -3 }} />
    </>
  )
}

const UpdateSafe = madProps(_UpdateSafe, {
  chain: useCurrentChain,
  safeInfo: useSafeInfo,
  queueSize: useQueuedTxsLength,
})

export default UpdateSafe
