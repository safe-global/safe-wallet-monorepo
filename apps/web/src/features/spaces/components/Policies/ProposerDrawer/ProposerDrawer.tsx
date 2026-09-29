import type { ReactElement } from 'react'
import { UserRoundPen } from 'lucide-react'
import { Drawer, DrawerBody } from '@/components/common/Drawer'
import { PolicyDrawerActions, PolicyDrawerActionsSkeleton } from '../components/PolicyDrawerActions'
import { PolicyDrawerHeader } from '../components/PolicyDrawerHeader'
import { ProposerOverviewSkeleton } from './components/ProposerOverview'
import { toPolicyStatus } from './utils'
import { ProposerVariantContent } from './variants'
import type { ProposerVariantContentProps } from './variants/types'

type ProposerDrawerActionProps = {
  actionLabel: string
  onAction: () => void
  actionHint?: string
  actionVariant?: 'default' | 'secondary'
  actionDisabled?: boolean
}

/** Everything the drawer shows once loaded: the status variant and its action. */
export type ProposerDrawerContentProps = ProposerDrawerActionProps & ProposerVariantContentProps

type ProposerDrawerBaseProps = {
  open: boolean
  onClose: () => void
}

type LoadingProposerDrawerProps = ProposerDrawerBaseProps & { isLoading: true }

type LoadedProposerDrawerProps = ProposerDrawerBaseProps & { isLoading?: false } & ProposerDrawerContentProps

export type ProposerDrawerProps = LoadingProposerDrawerProps | LoadedProposerDrawerProps

const ProposerDrawer = (props: ProposerDrawerProps): ReactElement => {
  const { open, onClose } = props

  return (
    <Drawer open={open} onClose={onClose} ariaLabel="Proposer role">
      <PolicyDrawerHeader
        icon={UserRoundPen}
        title="Proposer role"
        status={props.isLoading ? undefined : toPolicyStatus(props.status)}
      />
      <DrawerBody>{props.isLoading ? <ProposerOverviewSkeleton /> : <ProposerVariantContent {...props} />}</DrawerBody>
      {props.isLoading ? (
        <PolicyDrawerActionsSkeleton />
      ) : (
        <PolicyDrawerActions
          actionLabel={props.actionLabel}
          onClick={props.onAction}
          hint={props.actionHint}
          variant={props.actionVariant}
          disabled={props.actionDisabled}
        />
      )}
    </Drawer>
  )
}

export default ProposerDrawer
