import type { ReactNode } from 'react'

/**
 * Layout shell for the popup's message states: content across the top, one action right-aligned under
 * it. The popup is already a card, so these states add no surface of their own. Tone is the caller's —
 * only the geometry is shared.
 */
const PopupMessage = ({
  children,
  action,
  ...props
}: {
  children: ReactNode
  action: ReactNode
  'data-testid'?: string
}) => (
  <div className="flex flex-col items-end gap-2.5 p-4" {...props}>
    <div className="flex w-full items-start gap-2">{children}</div>
    {action}
  </div>
)

export default PopupMessage
