import { AlertCircle, RotateCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Typography } from '@/components/ui/typography'
import {
  BALANCES_LOAD_ERROR_TEXT,
  HELD_GROUP_LABEL,
  RETRY_TEXT,
  SKELETON_ROW_COUNT,
  TOKEN_ICON_SIZE,
} from './constants'

/** Same geometry as `ComboboxLabel`, without needing a Base UI group ancestor. */
const GroupHeading = ({ children }: { children: string }) => (
  <div className="text-muted-foreground px-2 py-1.5 text-xs">{children}</div>
)

/** The "Your tokens" slot while balances load: the popular group below stays selectable. */
export const HeldTokensLoading = () => (
  <div data-testid="held-tokens-loading" className="p-1">
    <GroupHeading>{HELD_GROUP_LABEL}</GroupHeading>
    {Array.from({ length: SKELETON_ROW_COUNT }, (_, index) => (
      <div key={index} className="flex items-center gap-2 px-2 py-1.5">
        <Skeleton className="shrink-0 rounded-full" style={{ width: TOKEN_ICON_SIZE, height: TOKEN_ICON_SIZE }} />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="ml-auto h-3 w-16" />
      </div>
    ))}
  </div>
)

/** The "Your tokens" slot when balances failed: message plus retry; popular tokens stay selectable. */
export const HeldTokensError = ({ onRetry }: { onRetry: () => void }) => (
  <div data-testid="held-tokens-error" className="p-1">
    <GroupHeading>{HELD_GROUP_LABEL}</GroupHeading>
    <div className="flex items-center gap-2 px-2 py-1.5">
      <AlertCircle className="text-destructive size-4 shrink-0" />
      <Typography variant="paragraph-small" className="text-destructive min-w-0 flex-1">
        {BALANCES_LOAD_ERROR_TEXT}
      </Typography>
      <Button variant="ghost" size="sm" onClick={onRetry}>
        <RotateCw className="size-3.5" />
        {RETRY_TEXT}
      </Button>
    </div>
  </div>
)
