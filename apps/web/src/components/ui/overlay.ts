import { cva, type VariantProps } from 'class-variance-authority'

/**
 * Overlay — the one backdrop every modal surface shares.
 *
 * Dialogs, alert dialogs, sheets, drawers, backdrop-ed selects and the support-chat panel all
 * render this class, so the scrim is tinted, blurred and stacked in a single place. Before this
 * existed the app shipped four hand-copied scrims that drifted apart in the MUI -> shadcn
 * migration: two of them had no blur at all and two sat two orders of magnitude below
 * `--z-overlay`. Change the look here, never at the call site.
 *
 * The tint is the `--backdrop` token (styles/shadcn.css). The blur sits behind
 * `supports-backdrop-filter:` so a browser without `backdrop-filter` still gets the tint.
 *
 * `data-closed:pointer-events-none` is load-bearing, not a nicety: a surface that mounts already
 * open and closes in the same commit never runs its enter animation, so Base UI waits forever for
 * an `animationend` and leaves the backdrop mounted at `opacity: 0` with `pointer-events: auto` —
 * an invisible full-viewport shield that swallows every click on the page (this is what broke the
 * topbar's "Open sidebar menu" button below `md`). A closed backdrop must never capture pointer
 * events, however it got there.
 */
export const overlayVariants = cva(
  'bg-backdrop supports-backdrop-filter:backdrop-blur-xs fixed inset-0 z-[var(--z-overlay)] duration-100',
  {
    variants: {
      /**
       * How the scrim fades. `state` reads the `data-open` / `data-closed` (and Base UI
       * starting/ending style) attributes the overlay primitives put on the backdrop element;
       * `mount` is for a plain element that has none of those and is unmounted when closed.
       */
      transition: {
        state:
          'data-open:animate-in data-closed:animate-out data-open:fade-in-0 data-closed:fade-out-0 data-starting-style:opacity-0 data-ending-style:opacity-0 data-closed:pointer-events-none',
        mount: 'animate-in fade-in-0',
      },
    },
    defaultVariants: {
      transition: 'state',
    },
  },
)

export type OverlayVariants = VariantProps<typeof overlayVariants>
