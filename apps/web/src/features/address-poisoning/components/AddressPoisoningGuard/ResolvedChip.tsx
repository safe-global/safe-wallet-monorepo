import type { ReactElement } from 'react'
import { Check, Undo2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/utils/cn'
import { RESOLVED_ICON_BG, RESOLVED_TONE } from './tokens'

/**
 * Shown only after the trusted swap — the recipient is now the verified address-book entry,
 * so the warning is replaced by this green confirmation with an undo back to the guard.
 */
const ResolvedChip = ({ trustedName, onUndo }: { trustedName: string; onUndo: () => void }): ReactElement => (
  <div className={cn('mt-3 flex items-start gap-3 rounded-2xl p-3.5', RESOLVED_TONE.trusted)}>
    <span className={cn('grid size-6 shrink-0 place-items-center rounded-full text-white', RESOLVED_ICON_BG.trusted)}>
      <Check size={15} strokeWidth={3} />
    </span>
    <div className="min-w-0 flex-1">
      <div className="text-sm font-semibold leading-6">Recipient set to {trustedName}’s verified address</div>
    </div>
    <Button
      type="button"
      variant="link"
      onClick={onUndo}
      className="h-auto shrink-0 gap-1.5 self-center bg-transparent p-0 text-xs font-semibold text-inherit no-underline hover:bg-transparent hover:no-underline"
    >
      <Undo2 size={13} /> Undo
    </Button>
  </div>
)

export default ResolvedChip
