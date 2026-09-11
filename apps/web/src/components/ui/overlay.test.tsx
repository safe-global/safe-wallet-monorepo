import { render } from '@testing-library/react'
import { overlayVariants } from './overlay'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from './dialog'
import { AlertDialog, AlertDialogContent } from './alert-dialog'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from './sheet'
import { Select, SelectContent, SelectItem } from './select'
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from './drawer'
import { Popover, PopoverContent } from './popover'

/** The tint + blur pair that makes a scrim a Safe scrim. Every modal surface must carry both. */
const SCRIM = ['bg-backdrop', 'supports-backdrop-filter:backdrop-blur-xs']

const SURFACES: [name: string, ui: React.ReactElement, slot: string][] = [
  [
    'dialog',
    <Dialog open key="dialog">
      <DialogContent showCloseButton={false}>
        <DialogTitle>Title</DialogTitle>
        <DialogDescription>Body</DialogDescription>
      </DialogContent>
    </Dialog>,
    'dialog-overlay',
  ],
  [
    'alert dialog',
    <AlertDialog open key="alert-dialog">
      <AlertDialogContent>Body</AlertDialogContent>
    </AlertDialog>,
    'alert-dialog-overlay',
  ],
  [
    'sheet',
    <Sheet open key="sheet">
      <SheetContent showCloseButton={false}>
        <SheetTitle>Title</SheetTitle>
        <SheetDescription>Body</SheetDescription>
      </SheetContent>
    </Sheet>,
    'sheet-overlay',
  ],
  [
    'drawer',
    <Drawer open key="drawer">
      <DrawerContent>
        <DrawerTitle>Title</DrawerTitle>
        <DrawerDescription>Body</DrawerDescription>
      </DrawerContent>
    </Drawer>,
    'drawer-overlay',
  ],
  [
    'popover panel',
    <Popover open key="popover">
      <PopoverContent showBackdrop>Body</PopoverContent>
    </Popover>,
    'popover-backdrop',
  ],
  [
    'select',
    <Select open key="select">
      <SelectContent showBackdrop>
        <SelectItem value="a">A</SelectItem>
      </SelectContent>
    </Select>,
    'select-backdrop',
  ],
]

describe('overlayVariants', () => {
  it('tints and blurs, with the blur behind a support guard', () => {
    expect(overlayVariants()).toContain('bg-backdrop')
    expect(overlayVariants()).toContain('supports-backdrop-filter:backdrop-blur-xs')
  })

  it('stacks on the overlay layer', () => {
    expect(overlayVariants()).toContain('z-[var(--z-overlay)]')
  })

  it('never lets a closed backdrop capture pointer events', () => {
    expect(overlayVariants()).toContain('data-closed:pointer-events-none')
  })

  it('fades on mount when there are no open/closed data attributes to read', () => {
    const mount = overlayVariants({ transition: 'mount' })
    expect(mount).toContain('animate-in')
    expect(mount).not.toContain('data-open:')
  })
})

describe('modal surfaces', () => {
  it.each(SURFACES)('%s renders the shared scrim', (_name, ui, slot) => {
    const { baseElement } = render(ui)
    const backdrop = baseElement.querySelector(`[data-slot="${slot}"]`)

    expect(backdrop).not.toBeNull()
    SCRIM.forEach((className) => expect(backdrop).toHaveClass(className))
  })

  it('gives every surface the same scrim, so none of them drifts', () => {
    const scrims = SURFACES.map(([, ui, slot]) => {
      const { baseElement, unmount } = render(ui)
      const className = baseElement.querySelector(`[data-slot="${slot}"]`)?.className ?? ''
      unmount()
      return className
    })

    expect(new Set(scrims).size).toBe(1)
  })
})

describe('anchored surfaces', () => {
  it('a popover has no scrim unless it opts in', () => {
    const { baseElement } = render(
      <Popover open>
        <PopoverContent>Body</PopoverContent>
      </Popover>,
    )

    expect(baseElement.querySelector('[data-slot="popover-backdrop"]')).toBeNull()
  })
})
