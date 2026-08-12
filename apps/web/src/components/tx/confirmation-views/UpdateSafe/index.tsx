import type { TransactionData } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import type { ReactNode } from 'react'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Typography } from '@/components/ui/typography'
import semverSatisfies from 'semver/functions/satisfies'
import { useCurrentChain } from '@/hooks/useChains'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useQueuedTxsLength } from '@/hooks/useTxQueue'
import ExternalLink from '@/components/common/ExternalLink'
import { maybePlural } from '@safe-global/utils/utils/formatters'
import madProps from '@/utils/mad-props'
import { extractTargetVersionFromUpdateSafeTx } from '@/services/tx/safeUpdateParams'

const QUEUE_WARNING_VERSION = '<1.3.0'

function BgBox({ children, light, warning }: { children: ReactNode; light?: boolean; warning?: boolean }) {
  const bgcolor = warning
    ? 'bg-[var(--color-warning-background)]'
    : light
      ? 'bg-[var(--color-background-light)]'
      : 'bg-[var(--color-border-background)]'
  return <div className={`flex-1 rounded-md p-4 text-center text-lg font-bold ${bgcolor}`}>{children}</div>
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
      <div className="flex flex-row items-center gap-4">
        <BgBox>Current version: {safe.version}</BgBox>
        <div className="text-[28px]">→</div>
        {newVersion !== undefined ? (
          <BgBox light>
            New version: {newVersion} {chain?.l2 ? '+L2' : ''}
          </BgBox>
        ) : (
          <BgBox warning>Unknown contract</BgBox>
        )}
      </div>
      {newVersion !== undefined ? (
        <Typography>
          Read about the updates in the new Safe contracts version in the{' '}
          <ExternalLink href={`https://github.com/safe-global/safe-contracts/releases/tag/v${newVersion}`}>
            version {newVersion} changelog
          </ExternalLink>
        </Typography>
      ) : (
        <Alert variant="destructive">
          <AlertTitle>Unknown contract</AlertTitle>
          <AlertDescription>
            The target contract for this upgrade is unknown. Verify the transaction data and the target contract address
            before executing this transaction.
          </AlertDescription>
        </Alert>
      )}

      {showQueueWarning && (
        <Alert variant="warning">
          <AlertTitle>This upgrade will invalidate all queued transactions!</AlertTitle>
          <AlertDescription>
            You have {queueSize} unexecuted transaction{maybePlural(parseInt(queueSize))}. Please make sure to execute
            or delete them before upgrading, otherwise you&apos;ll have to reject or replace them after the upgrade.
          </AlertDescription>
        </Alert>
      )}

      <Separator className="mx-[-24px] my-2" />
    </>
  )
}

const UpdateSafe = madProps(_UpdateSafe, {
  chain: useCurrentChain,
  safeInfo: useSafeInfo,
  queueSize: useQueuedTxsLength,
})

export default UpdateSafe
