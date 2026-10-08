import type { ComponentProps } from 'react'
import { Button } from '@/components/ui/button'

// Closed preset: locks variant/size/margin so every top-bar icon button matches.
// Takes no size/variant/skin className — pass an icon child + aria-label/onClick.
type IconActionProps = Omit<ComponentProps<typeof Button>, 'size' | 'variant' | 'className'>

/**
 * IconAction — the compact icon-only action used in the top bar / headers
 * (search, notifications, batch, WalletConnect …). Locks `variant="ghost"`,
 * `size="icon-sm"` and the 1-unit margin so the top-bar icons stay uniform.
 */
const IconAction = (props: IconActionProps) => <Button {...props} variant="ghost" size="icon-sm" className="m-1" />

export default IconAction
