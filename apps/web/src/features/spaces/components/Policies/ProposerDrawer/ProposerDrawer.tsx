import type { ReactElement } from 'react'
import { UserRoundPen } from 'lucide-react'
import { Drawer, DrawerBody, DrawerHeader, DrawerTitle } from '@/components/common/Drawer'
import { Badge, BadgeDot } from '@/components/ui/badge'
import { ProposerActions } from './components/ProposerActions'
import { getProposerStatusColor, getProposerStatusLabel } from './utils'
import { ProposerVariantContent } from './variants'
import type { ProposerVariantContentProps } from './variants/types'

export type ProposerDrawerProps = {
  open: boolean
  onClose: () => void
  /** Reads differently per status, so the caller names the action. */
  actionLabel: string
  onAction: () => void
  /** Sits above the action to say what it needs first, e.g. a connected signer wallet. */
  actionHint?: string
  actionVariant?: 'default' | 'secondary'
  actionDisabled?: boolean
} & ProposerVariantContentProps

const ProposerDrawer = (props: ProposerDrawerProps): ReactElement => {
  const { open, onClose, status, actionLabel, onAction, actionHint, actionVariant, actionDisabled } = props

  return (
    <Drawer open={open} onClose={onClose} ariaLabel="Proposer role">
      <DrawerHeader>
        <div className="flex size-10 items-center justify-center rounded-lg bg-success-subtle">
          <UserRoundPen className="size-4 text-success-strong" />
        </div>
        <DrawerTitle size="lg">Proposer role</DrawerTitle>
        <Badge variant={getProposerStatusColor(status)} size="status" shape="status" className="ml-auto">
          <BadgeDot />
          {getProposerStatusLabel(status)}
        </Badge>
      </DrawerHeader>
      <DrawerBody>
        <ProposerVariantContent {...props} />
      </DrawerBody>
      <ProposerActions
        actionLabel={actionLabel}
        onClick={onAction}
        hint={actionHint}
        variant={actionVariant}
        disabled={actionDisabled}
      />
    </Drawer>
  )
}

export default ProposerDrawer
