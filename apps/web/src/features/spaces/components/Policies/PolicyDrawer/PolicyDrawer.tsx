import type { ReactElement } from 'react'
import { UserRoundPen } from 'lucide-react'
import { Drawer, DrawerBody, DrawerHeader, DrawerTitle } from '@/components/common/Drawer'
import { Badge, BadgeDot } from '@/components/ui/badge'
import { PolicyActions } from './components/PolicyActions'
import { getPolicyStatusColor, getPolicyStatusLabel } from './utils'
import { PolicyVariantContent } from './variants'
import type { PolicyVariantContentProps } from './variants/types'

export type PolicyDrawerProps = {
  open: boolean
  onClose: () => void
  /** Reads differently per status, so the caller names the action. */
  actionLabel: string
  onAction: () => void
  /** Sits above the action to say what it needs first, e.g. a connected signer wallet. */
  actionHint?: string
  actionVariant?: 'default' | 'secondary'
  actionDisabled?: boolean
} & PolicyVariantContentProps

const PolicyDrawer = (props: PolicyDrawerProps): ReactElement => {
  const { open, onClose, status, actionLabel, onAction, actionHint, actionVariant, actionDisabled } = props

  return (
    <Drawer open={open} onClose={onClose} ariaLabel="Proposer role">
      <DrawerHeader>
        <div className="flex size-10 items-center justify-center rounded-lg bg-success-subtle">
          <UserRoundPen className="size-4 text-success-strong" />
        </div>
        <DrawerTitle size="lg">Proposer role</DrawerTitle>
        <Badge variant={getPolicyStatusColor(status)} size="status" shape="status" className="ml-auto">
          <BadgeDot />
          {getPolicyStatusLabel(status)}
        </Badge>
      </DrawerHeader>
      <DrawerBody>
        <PolicyVariantContent {...props} />
      </DrawerBody>
      <PolicyActions
        actionLabel={actionLabel}
        onClick={onAction}
        hint={actionHint}
        variant={actionVariant}
        disabled={actionDisabled}
      />
    </Drawer>
  )
}

export default PolicyDrawer
