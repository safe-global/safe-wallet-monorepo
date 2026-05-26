import { type ReactElement } from 'react'
import { ShieldCheck } from 'lucide-react'
import AddAccounts from '@/features/spaces/components/AddAccounts'
import Track from '@/components/common/Track'
import { SPACE_EVENTS, SPACE_LABELS } from '@/services/analytics/events/spaces'
import { WidgetEmptyState } from '@/features/spaces/components/SafeWidget'

const SecurityEmptyState = (): ReactElement => {
  return (
    <div data-testid="security-empty-state" className="rounded-lg border border-border bg-card">
      <WidgetEmptyState
        className="max-w-[360px] mx-auto py-16"
        icon={<ShieldCheck className="size-6 text-green-500" />}
        text="No accounts to check yet"
        subtitle="Add a Safe account to this workspace to start running security checks and see its health here."
        action={
          <Track {...SPACE_EVENTS.ADD_ACCOUNTS_MODAL} label={SPACE_LABELS.security_page}>
            <AddAccounts buttonVariant="default" buttonLabel="Add account" />
          </Track>
        }
      />
    </div>
  )
}

export default SecurityEmptyState
