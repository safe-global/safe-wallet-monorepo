import type { ReactElement } from 'react'
import { BookUser, ChevronRight, Rocket, UsersRound, WalletCards } from 'lucide-react'
import { Typography } from '@/components/ui/typography'
import SafeWidget from '../SafeWidget'

const SETUP_STEPS = [
  { key: 'address-book', label: 'Import your address book', icon: BookUser },
  { key: 'safe-accounts', label: 'Add your Safe accounts', icon: WalletCards },
  { key: 'team-members', label: 'Invite team members', icon: UsersRound },
  { key: 'explore', label: 'Explore Spaces', icon: Rocket },
] as const

interface SetupWidgetProps {
  onDismiss?: () => void
}

const SetupWidget = ({ onDismiss }: SetupWidgetProps): ReactElement => {
  const handleStepClick = (stepKey: string) => {
    console.log('Setup step clicked:', stepKey)
  }

  const handleDismiss = () => {
    console.log('Setup widget dismissed')
    onDismiss?.()
  }

  return (
    <SafeWidget
      title="Set up your Space"
      testId="space-dashboard-setup-widget"
      action={
        <Typography
          variant="paragraph-small"
          color="muted"
          className="cursor-pointer"
          onClick={handleDismiss}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && handleDismiss()}
        >
          Dismiss
        </Typography>
      }
    >
      <div className="flex flex-col gap-2 px-2 pb-2">
        {SETUP_STEPS.map(({ key, label, icon: Icon }) => (
          <div
            key={key}
            role="button"
            tabIndex={0}
            onClick={() => handleStepClick(key)}
            onKeyDown={(e) => e.key === 'Enter' && handleStepClick(key)}
            className="flex cursor-pointer items-center gap-4 rounded-3xl bg-muted p-4 transition-colors hover:bg-muted/70"
          >
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-green-100">
              <Icon className="size-5 text-green-500" />
            </div>
            <Typography variant="paragraph-bold" className="flex-1">
              {label}
            </Typography>
            <ChevronRight className="size-5 text-muted-foreground" />
          </div>
        ))}
      </div>
    </SafeWidget>
  )
}

export { SetupWidget }
export type { SetupWidgetProps }
export default SetupWidget
