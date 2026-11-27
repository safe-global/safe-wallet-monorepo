import { useState, type ReactElement } from 'react'
import { X } from 'lucide-react'
import Identicon from '@safe-global/views/components/common/Identicon'
import { Button } from '@safe-global/views/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@safe-global/views/components/ui/popover'
import { useSidebar } from '@safe-global/views/components/ui/sidebar'
import { formatSafeAddress, getSafeAddress } from './fixtures'
import { SafeList } from './SafeList'
import type { Shell } from './useShell'

/** The picked Safe as its own item. It opens the same Safe list as the switcher, and × goes back to All Safes. */
export const SafeItem = ({ shell }: { shell: Shell }): ReactElement | null => {
  const { pickedSafe, workspace, hasAllSafes } = shell
  const { isMobile, setOpenMobile } = useSidebar()
  const [isOpen, setIsOpen] = useState(false)

  if (!pickedSafe) return null

  const pick = (safe: string | null) => {
    setIsOpen(false)
    if (isMobile) setOpenMobile(false)
    void shell.pickSafe(workspace.context, safe)
  }

  return (
    <div
      className="flex items-center gap-1 rounded-(--radius-md) border border-border p-1 group-data-[collapsible=icon]:border-0 group-data-[collapsible=icon]:p-0"
      data-testid="unified-safe-item"
    >
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger
          render={
            <button
              type="button"
              className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-sm p-1 text-left outline-hidden hover:bg-sidebar-accent focus-visible:bg-sidebar-accent aria-expanded:bg-sidebar-accent"
              aria-label={`Safe: ${pickedSafe.name}. Switch Safe`}
            />
          }
        >
          <span className="shrink-0">
            <Identicon address={getSafeAddress(pickedSafe.safe)} size={28} />
          </span>
          <span className="flex min-w-0 flex-col group-data-[collapsible=icon]:hidden">
            <span className="truncate text-sm font-semibold">{pickedSafe.name}</span>
            <span className="truncate font-mono text-xs text-muted-foreground">
              {formatSafeAddress(pickedSafe.safe)}
            </span>
          </span>
        </PopoverTrigger>
        <PopoverContent side={isMobile ? 'bottom' : 'right'} align="start" className="w-64 p-2">
          <SafeList
            workspace={workspace}
            selected={pickedSafe.safe}
            hasAllSafes={hasAllSafes}
            onPick={pick}
            autoFocus={!isMobile}
          />
        </PopoverContent>
      </Popover>
      {hasAllSafes && (
        <Button
          variant="ghost"
          size="icon-xs"
          className="group-data-[collapsible=icon]:hidden"
          aria-label="Back to All Safes"
          onClick={() => pick(null)}
          data-testid="unified-safe-clear"
        >
          <X aria-hidden />
        </Button>
      )}
    </div>
  )
}
