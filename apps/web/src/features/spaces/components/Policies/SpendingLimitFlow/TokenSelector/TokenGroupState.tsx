import { Skeleton } from '@/components/ui/skeleton'
import LoadError from '../../components/LoadError'
import { SKELETON_ROW_COUNT } from '../../constants'
import { TOKEN_ICON_SIZE } from './constants'

/** Same geometry as `ComboboxLabel`, without needing a Base UI group ancestor. */
const GroupHeading = ({ children }: { children: string }) => (
  <div className="text-muted-foreground px-2 py-1.5 text-xs">{children}</div>
)

type GroupStateProps = { label: string; 'data-testid': string }

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

/** One group failed to load; the other group stays selectable. */
export const TokenGroupError = ({
  label,
  message,
  onRetry,
  'data-testid': testId,
}: GroupStateProps & { message: string; onRetry: () => void }) => (
  <div className="p-1">
    <GroupHeading>{label}</GroupHeading>
    <LoadError message={message} onRetry={onRetry} data-testid={testId} />
  </div>
)
