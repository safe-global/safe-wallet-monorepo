import { useContext } from 'react'

import { Typography } from '@safe-global/views/components/ui/typography'
import { Link } from '@safe-global/views/components/ui/link'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import { TxFlowContext } from '@/components/tx-flow/TxFlowProvider'
import useSafeInfo from '@/hooks/useSafeInfo'
import usePreviousNonces from '@/hooks/usePreviousNonces'

const QueuedNonceHint = () => {
  const { safeTx, nonce, recommendedNonce, isReadOnly, setNonce } = useContext(SafeTxContext)
  const { isRejection } = useContext(TxFlowContext)
  const { safe } = useSafeInfo()
  const previousNonces = usePreviousNonces()

  if (nonce === undefined || recommendedNonce === undefined) return null
  const isEditable = !isReadOnly && (!safeTx || safeTx.signatures.size === 0)
  if (!isEditable || isRejection) return null
  if (nonce !== recommendedNonce || previousNonces.length === 0 || safe.nonce >= recommendedNonce) return null

  const lowestNonce = safe.nonce
  const isReplacement = previousNonces.includes(lowestNonce)
  const count = previousNonces.length

  return (
    <div className="border-b border-border px-[var(--space-3)] pb-3 -mt-1">
      <Typography variant="paragraph-small" color="muted">
        {count} transaction{count === 1 ? '' : 's'} already queued, so this one will be #{nonce}.{' '}
        <Link render={<button type="button" />} onClick={() => setNonce(lowestNonce)} className="whitespace-nowrap">
          {isReplacement ? 'Replace' : 'Use'} #{lowestNonce} instead
        </Link>
      </Typography>
    </div>
  )
}

export default QueuedNonceHint
