import type { Meta, StoryObj } from '@storybook/react'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../alert-dialog'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../dialog'
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from '../drawer'
import { Popover, PopoverContent, PopoverDescription, PopoverTitle } from '../popover'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '../sheet'

/**
 * Overlay (backdrop) Stories
 *
 * Every modal surface shares one scrim — `overlayVariants()` in `components/ui/overlay.ts`. These
 * stories exist for the backdrop, not the popups: each one puts a surface over dense page content
 * so Argos can see the tint and the blur. A blank canvas cannot show either, which is how four
 * different scrims drifted apart unnoticed in the first place.
 *
 * @see components/ui/overlay.ts
 */
const meta = {
  title: 'UI/Overlay',
  parameters: { layout: 'fullscreen' },
} satisfies Meta

export default meta
type Story = StoryObj

/** Fine text, hard table rules and saturated blocks — the detail a 4px blur is measured against. */
const PageBehind = () => (
  <div className="min-h-screen bg-[var(--color-background-main)] p-6">
    <h1 className="text-foreground mb-1 text-2xl font-bold">Assets</h1>
    <p className="text-muted-foreground mb-6 text-sm">Content behind the scrim, so the blur has something to blur.</p>

    <div className="mb-6 flex gap-3">
      {['#12ff80', '#5fddff', '#ff5f72', '#fbbf24', '#a78bfa'].map((color) => (
        <div
          key={color}
          className="h-16 w-28 rounded-lg"
          style={{ background: `linear-gradient(135deg, ${color}, #111)` }}
        />
      ))}
    </div>

    <table className="text-foreground w-full border-collapse text-xs">
      <thead>
        <tr className="border-border border-b">
          {['Asset', 'Balance', 'Value', 'Chain', 'Updated'].map((heading) => (
            <th key={heading} className="px-2 py-2 text-left font-medium">
              {heading}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: 14 }, (_, row) => (
          <tr key={row} className="border-border/60 border-b">
            <td className="px-2 py-1.5">0x{(row * 748213).toString(16).padStart(8, '0')}…c4f1</td>
            <td className="px-2 py-1.5">{(row * 13.37).toFixed(4)} ETH</td>
            <td className="px-2 py-1.5">${(row * 4211.9).toFixed(2)}</td>
            <td className="px-2 py-1.5">Ethereum</td>
            <td className="px-2 py-1.5">2 min ago</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)

export const DialogBackdrop: Story = {
  render: () => (
    <>
      <PageBehind />
      <Dialog open>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Dialog</DialogTitle>
            <DialogDescription>Shares the one scrim.</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  ),
}

export const AlertDialogBackdrop: Story = {
  render: () => (
    <>
      <PageBehind />
      <AlertDialog open>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Alert dialog</AlertDialogTitle>
            <AlertDialogDescription>Shares the one scrim.</AlertDialogDescription>
          </AlertDialogHeader>
        </AlertDialogContent>
      </AlertDialog>
    </>
  ),
}

export const SheetBackdrop: Story = {
  render: () => (
    <>
      <PageBehind />
      <Sheet open>
        <SheetContent showCloseButton={false}>
          <SheetHeader>
            <SheetTitle>Sheet</SheetTitle>
            <SheetDescription>Shares the one scrim.</SheetDescription>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    </>
  ),
}

export const DrawerBackdrop: Story = {
  render: () => (
    <>
      <PageBehind />
      <Drawer open direction="right">
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Drawer</DrawerTitle>
            <DrawerDescription>Shares the one scrim.</DrawerDescription>
          </DrawerHeader>
        </DrawerContent>
      </Drawer>
    </>
  ),
}

/**
 * A popover panel — a titled card with its own close button, like the header's Nested Safes,
 * notifications, wallet and WalletConnect popups. Those are modals that happen to be anchored, so
 * they opt into the same scrim via `showBackdrop`. A true dropdown (menu, select, date picker,
 * filter) never does; see the Popover story for that shape.
 */
export const PopoverPanelBackdrop: Story = {
  render: () => (
    <>
      <PageBehind />
      <Popover open>
        <PopoverContent showBackdrop anchor={{ getBoundingClientRect: () => new DOMRect(640, 320, 0, 0) }}>
          <PopoverTitle>Popover panel</PopoverTitle>
          <PopoverDescription>Opted into the one scrim via showBackdrop.</PopoverDescription>
        </PopoverContent>
      </Popover>
    </>
  ),
}
