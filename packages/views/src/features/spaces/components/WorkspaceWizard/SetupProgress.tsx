import { Button } from '@safe-global/views/components/ui/button'
import { Spinner } from '@safe-global/views/components/ui/spinner'
import { Typography } from '@safe-global/views/components/ui/typography'

type SetupProgressProps = {
  title: string
  body?: string
  isWorking: boolean
  actionLabel?: string
  onAction?: () => void
}

/** Full-screen status while a new Workspace is set up after its checkout. */
const SetupProgress = ({ title, body, isWorking, actionLabel, onAction }: SetupProgressProps) => (
  <div
    className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center"
    role="status"
    data-testid="workspace-setup-progress"
  >
    {isWorking && <Spinner className="size-8" />}
    <Typography variant="h2">{title}</Typography>
    {body && (
      <Typography variant="paragraph" color="muted" className="max-w-md">
        {body}
      </Typography>
    )}
    {actionLabel && onAction && (
      <Button size="lg" onClick={onAction}>
        {actionLabel}
      </Button>
    )}
  </div>
)

export default SetupProgress
