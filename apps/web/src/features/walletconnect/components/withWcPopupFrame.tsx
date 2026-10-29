import type { Decorator } from '@storybook/react'

/** Stories render inside the WalletConnect popup's surface; keep in step with `Popup` in @safe-global/views. */
export const withWcPopupFrame: Decorator = (Story) => (
  <div className="bg-popover text-popover-foreground ring-foreground/10 flex w-[454px] max-w-[calc(100vw-1rem)] flex-col gap-4 rounded-3xl p-4 text-sm shadow-lg ring-1">
    <Story />
  </div>
)
