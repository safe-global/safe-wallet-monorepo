import type { ReactElement } from 'react'
import { DrawerFooter } from '@/components/common/Drawer'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'

export type ProposerActionsProps = {
  /** What the drawer's primary action does here — it reads differently per proposer role status. */
  actionLabel: string
  onClick: () => void
  /** Sits above the button to say why the action is unavailable, or what it needs first. */
  hint?: string
  variant?: 'default' | 'secondary'
  disabled?: boolean
}

/** The drawer's footer action for one proposer role status. */
const ProposerActions = ({
  actionLabel,
  onClick,
  hint,
  variant = 'default',
  disabled = false,
}: ProposerActionsProps): ReactElement => (
  <DrawerFooter>
    <div className="flex flex-col gap-2">
      {hint && (
        <Typography variant="paragraph-mini" color="muted" align="center">
          {hint}
        </Typography>
      )}

      <Button variant={variant} className="w-full" onClick={onClick} disabled={disabled}>
        {actionLabel}
      </Button>
    </div>
  </DrawerFooter>
)

export default ProposerActions
