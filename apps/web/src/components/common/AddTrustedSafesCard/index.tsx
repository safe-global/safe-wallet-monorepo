import { Settings2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import { useDarkMode } from '@/hooks/useDarkMode'
import { cn } from '@/utils/cn'

/**
 * Empty state shown when a wallet is connected but the user has not curated any
 * trusted (local) Safe accounts yet. Opens the "Manage trusted Safes" modal via
 * `onAdd`. Mirrors GetStartedCard so the signed-in and signed-out empty states
 * on the Trusted accounts tab stay visually consistent.
 */
const AddTrustedSafesCard = ({ onAdd }: { onAdd: () => void }) => {
  const isDarkMode = useDarkMode()

  return (
    <div className={cn('shadcn-scope flex justify-center pt-10', isDarkMode && 'dark')}>
      <div
        data-testid="add-trusted-safes-card"
        className="flex w-full max-w-[440px] flex-col items-center gap-5 rounded-3xl bg-card px-4 py-20"
      >
        <div className="flex flex-col items-center gap-1">
          <Typography variant="paragraph-medium">No trusted accounts</Typography>
          <Typography variant="paragraph-small" color="muted" align="center" className="max-w-[336px]">
            Manage your trusted list to add or remove accounts.
          </Typography>
        </div>

        <Button onClick={onAdd} data-testid="add-trusted-safes-button">
          <Settings2 className="size-4" />
          Manage trusted Safes
        </Button>
      </div>
    </div>
  )
}

export default AddTrustedSafesCard
