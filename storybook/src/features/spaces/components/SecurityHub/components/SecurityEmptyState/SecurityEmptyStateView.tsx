import React, { type ReactElement, type ReactNode } from 'react'
import { ArrowUpRight, ShieldCheck } from 'lucide-react'
import Track from '@/components/common/Track'
import { SPACE_EVENTS, SPACE_LABELS } from '@/services/analytics/events/spaces'
import { WidgetEmptyState } from '@/features/spaces/components/SafeWidget/WidgetEmptyState'
import { Card } from '@/components/ui/card'
import { Typography } from '@/components/ui/typography'
import css from './styles.module.css'
import { cn } from '@/utils/cn'

interface EmptyCardItemProps {
  iconNode: React.ReactNode | string
  title: string
  label?: string
  description: string
  onClick: () => void
}

const EmptyCardItem = ({ iconNode, title, description, label, onClick }: EmptyCardItemProps) => {
  return (
    <Card className={cn(css.emptyCardState, 'group')} onClick={onClick}>
      {typeof iconNode === 'string' ? (
        <div>
          <img alt="" className="w-[54px] rounded-md" src={iconNode} />
        </div>
      ) : (
        <div className="flex size-14 items-center justify-center rounded-md bg-green-100">{iconNode}</div>
      )}

      {label && (
        <Typography
          variant="paragraph-mini-bold"
          className="group-hover:opacity-0 transition-opacity uppercase absolute right-6 top-6"
          color="muted"
        >
          {label}
        </Typography>
      )}

      <div className="rounded-full absolute top-6 right-6 scale-0 transition-all opacity-0 group-hover:opacity-100 group-hover:scale-100 bg-primary aspect-square text-primary-foreground w-[34px] flex items-center justify-center">
        <ArrowUpRight className="w-5" />
      </div>

      <div>
        <Typography variant="h4" className="mb-1">
          {title}
        </Typography>
        <Typography variant="paragraph-small" color="muted">
          {description}
        </Typography>
      </div>
    </Card>
  )
}

export type SecurityEmptyStateViewProps = {
  onHypernativeClick: () => void
  renderAddAccounts: (props: { buttonVariant: 'default'; buttonLabel: string }) => ReactElement
}

export const SecurityEmptyStateView = ({
  onHypernativeClick,
  renderAddAccounts,
}: SecurityEmptyStateViewProps): ReactElement => {
  const cards = [
    // TODO: We're hidding it because of the incident
    // {
    //   label: 'free',
    //   title: 'Account recovery',
    //   description: 'Never lose access to your Safe.',
    //   icon: <KeyRound />,
    //   onClick: onAccountRecoveryClick,
    // },
    {
      label: 'enterprise',
      title: 'Hypernative Guardian',
      description: 'Block risky transactions automatically.',
      icon: '/images/hypernative/hypernative-icon.svg',
      onClick: onHypernativeClick,
    },
  ]

  return (
    <>
      <div data-testid="security-empty-state" className="rounded-lg bg-card">
        <WidgetEmptyState
          className="max-w-[360px] mx-auto py-16"
          icon={<ShieldCheck className="size-6 text-green-500" />}
          text="No accounts to check yet"
          subtitle="Add a Safe account to this Workspace to start running security checks and see its health here."
          action={
            <Track {...SPACE_EVENTS.ADD_ACCOUNTS_MODAL} label={SPACE_LABELS.security_page}>
              {renderAddAccounts({ buttonVariant: 'default', buttonLabel: 'Add account' })}
            </Track>
          }
        />
      </div>

      <Typography as="h4" variant="paragraph-mini" className="my-3 text-secondary-foreground">
        AVAILABLE ON EVERY SAFE YOU ADD
      </Typography>

      <div className="flex gap-4 flex-1 md:flex-row flex-col">
        {cards.map((card, index) => (
          <EmptyCardItem
            onClick={card.onClick}
            key={index}
            label={card.label}
            iconNode={card.icon}
            title={card.title}
            description={card.description}
          />
        ))}
      </div>
    </>
  )
}
