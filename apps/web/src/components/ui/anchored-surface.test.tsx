import { render } from '@testing-library/react'
import { Popover, PopoverContent } from './popover'
import { Select, SelectContent, SelectItem } from './select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem } from './dropdown-menu'

/**
 * The edge that makes an anchored panel readable. `--popover` and `--background` are both #ffffff in
 * light mode, so a shadow alone leaves the panel with no boundary against the page. `ring-foreground/10`
 * flips polarity with the theme, giving a dark hairline on light and a light one on dark.
 */
const EDGE = ['ring-1', 'ring-foreground/10']

const SURFACES: [name: string, ui: React.ReactElement, slot: string][] = [
  [
    'popover',
    <Popover open key="popover">
      <PopoverContent>Body</PopoverContent>
    </Popover>,
    'popover-content',
  ],
  [
    'select',
    <Select open key="select">
      <SelectContent>
        <SelectItem value="a">A</SelectItem>
      </SelectContent>
    </Select>,
    'select-content',
  ],
  [
    'dropdown menu',
    <DropdownMenu open key="dropdown-menu">
      <DropdownMenuContent>
        <DropdownMenuItem>A</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>,
    'dropdown-menu-content',
  ],
]

describe('anchored surfaces', () => {
  it.each(SURFACES)('%s draws a visible edge against the page', (_name, ui, slot) => {
    const { baseElement } = render(ui)
    const surface = baseElement.querySelector(`[data-slot="${slot}"]`)

    expect(surface).not.toBeNull()
    EDGE.forEach((cls) => expect(surface).toHaveClass(cls))
  })
})
