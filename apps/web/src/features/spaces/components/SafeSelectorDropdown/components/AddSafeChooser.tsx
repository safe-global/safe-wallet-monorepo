import { type ReactNode } from 'react'
import { useRouter } from 'next/router'
import { ChevronRight, CirclePlus, Plus } from 'lucide-react'
import { AppRoutes } from '@/config/routes'
import { buildCurrentNextUrl } from '@/utils/nextUrl'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/utils/cn'

interface AddSafeChooserProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const ChooserRow = ({
  icon,
  title,
  subtitle,
  onClick,
  testId,
}: {
  icon: ReactNode
  title: string
  subtitle: string
  onClick: () => void
  testId?: string
}) => (
  <button
    type="button"
    data-testid={testId}
    onClick={onClick}
    className={cn(
      'group text-sidebar-foreground flex w-full items-center gap-3 rounded-md p-3 text-left text-sm transition-colors',
      'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-pointer [&_svg]:[stroke-width:2] [&_svg]:transition-colors hover:[&_svg]:text-green-500',
    )}
  >
    <span className="shrink-0">{icon}</span>
    <span className="min-w-0 flex-1">
      <span className="block font-semibold">{title}</span>
      <span className="text-muted-foreground group-hover:text-sidebar-accent-foreground/70 mt-1 block text-xs">
        {subtitle}
      </span>
    </span>
    <ChevronRight className="size-3.5 shrink-0" />
  </button>
)

/**
 * Lightweight "Add a Safe account" chooser for the safe-selector dropdown. Rendered outside the
 * base-ui `Select` so it survives the dropdown closing, mirroring the page-level chooser.
 */
const AddSafeChooser = ({ open, onOpenChange }: AddSafeChooserProps) => {
  const router = useRouter()

  const go = (pathname: string) => {
    onOpenChange(false)
    router.push({ pathname, query: { next: buildCurrentNextUrl(router.pathname, router.query) } })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton className="dark:border-border max-w-[440px] p-6 dark:border">
        <DialogHeader className="p-0 pb-3">
          <DialogTitle className="font-bold">Add a Safe account</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <ChooserRow
            icon={<Plus className="size-4" />}
            title="Add existing Safe"
            subtitle="Watch or import a Safe by its address"
            onClick={() => go(AppRoutes.newSafe.load)}
            testId="dropdown-add-existing-safe"
          />
          <ChooserRow
            icon={<CirclePlus className="size-4" />}
            title="Create new Safe"
            subtitle="Create a new Safe account"
            onClick={() => go(AppRoutes.newSafe.create)}
            testId="dropdown-create-safe"
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default AddSafeChooser
