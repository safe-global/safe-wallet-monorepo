import { useContext } from 'react'
import { Info } from 'lucide-react'

import { Alert, AlertDescription, AlertSeverityIcon } from '@safe-global/views/components/ui/alert'
import { Link } from '@safe-global/views/components/ui/link'
import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'
import InfoIcon from '@safe-global/views/assets/images/notifications/info.svg'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import { TxFlowContext } from '@/components/tx-flow/TxFlowProvider'
import useSafeInfo from '@/hooks/useSafeInfo'
import usePreviousNonces from '@/hooks/usePreviousNonces'

const HintLink = ({ onClick, children }: { onClick: () => void; children: string }) => (
  <Link render={<button type="button" />} onClick={onClick} className="whitespace-nowrap">
    {children}
  </Link>
)

const QueuedNonceHint = () => {
  const { safeTx, nonce, recommendedNonce, isReadOnly, setNonce } = useContext(SafeTxContext)
  const { isRejection } = useContext(TxFlowContext)
  const { safe, safeLoaded } = useSafeInfo()
  const previousNonces = usePreviousNonces()

  if (!safeLoaded || nonce === undefined || recommendedNonce === undefined) return null
  const isEditable = !isReadOnly && (!safeTx || safeTx.signatures.size === 0)
  if (!isEditable || isRejection) return null

  let content
  if (previousNonces.includes(nonce)) {
    content = (
      <Alert variant="warning" outlined={false}>
        <AlertSeverityIcon variant="warning" />
        <AlertDescription>
          A queued transaction already uses this nonce. Only the one executed first will go through.{' '}
          <HintLink onClick={() => setNonce(recommendedNonce)}>Undo</HintLink>
        </AlertDescription>
      </Alert>
    )
  } else if (nonce === recommendedNonce && previousNonces.length > 0 && safe.nonce < recommendedNonce) {
    const lowestNonce = safe.nonce
    content = (
      <Alert variant="subtle">
        <Info />
        <AlertDescription>
          Queued transactions will run before this one.{' '}
          <HintLink onClick={() => setNonce(lowestNonce)}>
            {previousNonces.includes(lowestNonce) ? 'Use the oldest nonce instead' : 'Move it to the front instead'}
          </HintLink>
          <Tooltip>
            <TooltipTrigger
              render={
                <span className="ml-1 inline-flex align-middle text-[var(--color-border-main)]">
                  <InfoIcon className="size-4" />
                </span>
              }
            />
            <TooltipContent className="max-w-xs">
              Transactions are executed in order of their nonce, starting from the lowest one. Using the lowest nonce
              puts this transaction first in line. If a queued transaction already has that nonce, only one of them can
              be executed.
            </TooltipContent>
          </Tooltip>
        </AlertDescription>
      </Alert>
    )
  }

  if (!content) return null

  return (
    <div data-queued-nonce-hint className="border-b border-border px-[var(--space-3)] pb-3 -mt-1">
      {content}
    </div>
  )
}

export default QueuedNonceHint
