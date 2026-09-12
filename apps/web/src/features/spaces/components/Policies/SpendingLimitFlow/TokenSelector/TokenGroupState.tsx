import { AlertCircle, RotateCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Typography } from '@/components/ui/typography'
import { RETRY_TEXT, SKELETON_ROW_COUNT, TOKEN_ICON_SIZE } from './constants'

/** Same geometry as `ComboboxLabel`, without needing a Base UI group ancestor. */
const GroupHeading = ({ children }: { children: string }) => (
  <div className="text-muted-foreground px-2 py-1.5 text-xs">{children}</div>
)

type GroupStateProps = { label: string; 'data-testid': string }

/** One group's slot while its tokens load; the other group stays selectable. */
export const TokenGroupLoading = ({ label, 'data-testid': testId }: GroupStateProps) => (
  <div data-testid={testId} className="p-1">
    <GroupHeading>{label}</GroupHeading>
    {Array.from({ length: SKELETON_ROW_COUNT }, (_, index) => (
      <div key={index} className="flex items-center gap-2 px-2 py-1.5">
        <Skeleton className="shrink-0 rounded-full" style={{ width: TOKEN_ICON_SIZE, height: TOKEN_ICON_SIZE }} />
        <Skeleton className="h-4 w-24" />
      </div>
    ))}
  </div>
)

/** One group's slot when its tokens failed to load: message plus retry; the other group stays selectable. */
export const TokenGroupError = ({
  label,
  message,
  onRetry,
  'data-testid': testId,
}: GroupStateProps & { message: string; onRetry: () => void }) => (
  <div data-testid={testId} className="p-1">
    <GroupHeading>{label}</GroupHeading>
    <div className="flex items-center gap-2 px-2 py-1.5">
      <AlertCircle className="text-destructive size-4 shrink-0" />
      <Typography variant="paragraph-small" className="text-destructive min-w-0 flex-1">
        {message}
      </Typography>
      <Button variant="ghost" size="sm" onClick={onRetry}>
        <RotateCw className="size-3.5" />
        {RETRY_TEXT}
      </Button>
    </div>
  </div>
)
