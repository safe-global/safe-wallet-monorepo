import * as React from 'react'
import {
  Group as ResizablePanelGroup,
  Panel as ResizablePanel,
  Separator as ResizableHandle,
} from 'react-resizable-panels'

import { cn } from '@/utils/cn'

/**
 * Resizable Component
 *
 * Resizable panel layout (split panes with draggable dividers). Built on react-resizable-panels.
 *
 * @see https://ui.shadcn.com/docs/components/base/resizable
 *
 * @example
 * ```tsx
 * <ResizablePanelGroup direction="horizontal">
 *   <ResizablePanel defaultSize={25}>Panel 1</ResizablePanel>
 *   <ResizableHandle />
 *   <ResizablePanel defaultSize={75}>Panel 2</ResizablePanel>
 * </ResizablePanelGroup>
 * ```
 *
 * @remarks
 * Key Props:
 * - ResizablePanelGroup: `direction` ('horizontal' | 'vertical'), `autoSaveId`
 * - ResizablePanel: `defaultSize`, `minSize`
 * - ResizableHandle: `withHandle` — see Base UI / react-resizable-panels
 */

function ResizablePanelGroupComp({ className, ...props }: React.ComponentProps<typeof ResizablePanelGroup>) {
  return (
    <ResizablePanelGroup
      data-slot="resizable-panel-group"
      className={cn('flex h-full w-full data-[panel-group-direction=vertical]:flex-col', className)}
      {...props}
    />
  )
}

function ResizablePanelComp({ ...props }: React.ComponentProps<typeof ResizablePanel>) {
  return <ResizablePanel data-slot="resizable-panel" {...props} />
}

function ResizableHandleComp({
  withHandle,
  className,
  ...props
}: React.ComponentProps<typeof ResizableHandle> & {
  withHandle?: boolean
}) {
  return (
    <ResizableHandle
      data-slot="resizable-handle"
      className={cn(
        'bg-border focus-visible:ring-ring relative flex w-px items-center justify-center after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 focus-visible:ring-1 focus-visible:ring-offset-1 focus-visible:outline-hidden data-[panel-group-direction=vertical]:h-px data-[panel-group-direction=vertical]:w-full data-[panel-group-direction=vertical]:after:left-0 data-[panel-group-direction=vertical]:after:h-1 data-[panel-group-direction=vertical]:after:w-full data-[panel-group-direction=vertical]:after:translate-x-0 data-[panel-group-direction=vertical]:after:-translate-y-1/2 [&[data-panel-group-direction=vertical]>div]:rotate-90',
        className,
      )}
      {...props}
    >
      {withHandle && <div className="bg-border h-6 w-1 rounded-lg z-10 flex shrink-0" />}
    </ResizableHandle>
  )
}

export {
  ResizablePanelGroupComp as ResizablePanelGroup,
  ResizablePanelComp as ResizablePanel,
  ResizableHandleComp as ResizableHandle,
}
