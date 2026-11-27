import type { ReactElement } from 'react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'
import { QUEUE_HINT_CLASS, QUEUE_TRIGGER_FOCUS, QueueHintContent } from './QueueHint'

export const NONCE_ORDER_NOTE = 'Each Safe runs its nonces in order, one at a time.'

type QueueNonceProps = {
  nonce?: number
  /** What the nonce's state is, e.g. "Ready to sign" or "Conflicting transaction" */
  state: string
  /** What happens next, in a sentence or two */
  hint: string
  defaultOpen?: boolean
}

/** A row's nonce: its tooltip says where the transaction stands in the Safe's order */
const QueueNonce = ({ nonce, state, hint, defaultOpen }: QueueNonceProps): ReactElement => (
  <Tooltip defaultOpen={defaultOpen}>
    <TooltipTrigger
      aria-label={`Nonce ${nonce ?? ''}. ${hint}`}
      onClick={(event) => event.stopPropagation()}
      className={`px-0.5 text-sm tabular-nums ${QUEUE_TRIGGER_FOCUS}`}
    >
      {nonce}
    </TooltipTrigger>
    <TooltipContent className={QUEUE_HINT_CLASS}>
      <QueueHintContent title={`Nonce ${nonce ?? ''} · ${state}`} body={`${hint} ${NONCE_ORDER_NOTE}`} />
    </TooltipContent>
  </Tooltip>
)

export default QueueNonce
