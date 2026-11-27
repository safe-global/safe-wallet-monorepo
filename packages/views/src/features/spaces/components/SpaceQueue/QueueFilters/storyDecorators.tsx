import type { Decorator } from '@storybook/react'
import { Button } from '@safe-global/views/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@safe-global/views/components/ui/dropdown-menu'

/** Renders menu items inside an open dropdown, as the Filter menu does */
export const InOpenMenu: Decorator = (Story) => (
  <DropdownMenu defaultOpen>
    <DropdownMenuTrigger render={<Button variant="outline" />}>Options</DropdownMenuTrigger>
    <DropdownMenuContent align="start" className="min-w-56">
      <Story />
    </DropdownMenuContent>
  </DropdownMenu>
)
