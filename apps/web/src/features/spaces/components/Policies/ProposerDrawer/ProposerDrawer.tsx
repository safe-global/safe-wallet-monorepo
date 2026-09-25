import type { ReactElement } from 'react'
import { UserRoundPen } from 'lucide-react'
import { Drawer, DrawerBody, DrawerHeader, DrawerTitle } from '@/components/common/Drawer'
import { Badge, BadgeDot } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { PolicyDrawerActions, PolicyDrawerActionsSkeleton } from '../components/PolicyDrawerActions'
import { ProposerOverviewSkeleton } from './components/ProposerOverview'
import { getProposerStatusColor, getProposerStatusLabel } from './utils'
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
      <DrawerHeader>
        <div className="flex size-10 items-center justify-center rounded-lg bg-success-subtle">
          <UserRoundPen className="size-4 text-success-strong" />
        </div>
        <DrawerTitle size="lg">Proposer role</DrawerTitle>
        {props.isLoading ? (
          <Skeleton className="ml-auto h-6 w-24 rounded-lg" data-testid="proposer-status-skeleton" />
        ) : (
          <Badge variant={getProposerStatusColor(props.status)} size="status" shape="status" className="ml-auto">
            <BadgeDot />
            {getProposerStatusLabel(props.status)}
          </Badge>
        )}
      </DrawerHeader>
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
