import type { ReactNode } from 'react'
import { Alert, AlertTitle, AlertDescription, AlertSeverityIcon } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Typography } from '@/components/ui/typography'
import ExternalLink from '@/components/common/ExternalLink'
import { maybePlural } from '@safe-global/utils/utils/formatters'

function BgBox({ children, light, warning }: { children: ReactNode; light?: boolean; warning?: boolean }) {
  const bgcolor = warning
    ? 'bg-[var(--color-warning-background)]'
    : light
      ? 'bg-[var(--color-background-light)]'
      : 'bg-[var(--color-border-background)]'
  return <div className={`flex-1 rounded-md p-4 text-center text-lg font-bold ${bgcolor}`}>{children}</div>
}

export type UpdateSafeViewProps = {
  currentVersion: string
  newVersion?: string
  isL2?: boolean
  showQueueWarning: string | boolean
  queueSize: string
}

export function UpdateSafeView({ currentVersion, newVersion, isL2, showQueueWarning, queueSize }: UpdateSafeViewProps) {
  return (
    <>
      <div className="flex flex-row items-center gap-4">
        <BgBox>Current version: {currentVersion}</BgBox>
        <div className="text-[28px]">→</div>
        {newVersion !== undefined ? (
          <BgBox light>
            New version: {newVersion} {isL2 ? '+L2' : ''}
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
          <AlertSeverityIcon variant="destructive" />
          <AlertTitle>Unknown contract</AlertTitle>
          <AlertDescription>
            The target contract for this upgrade is unknown. Verify the transaction data and the target contract address
            before executing this transaction.
          </AlertDescription>
        </Alert>
      )}

      {showQueueWarning && (
        <Alert variant="warning" outlined={false}>
          <AlertSeverityIcon variant="warning" />
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
