import type { Meta, StoryObj } from '@storybook/react'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '../dropdown-menu'
import { Button } from '../button'
import { Settings, User, LogOut, CreditCard } from 'lucide-react'

/**
 * DropdownMenu Component Stories
 *
 * Figma: No Figma design available
 */
const meta = {
  title: 'UI/DropdownMenu',
  component: DropdownMenu,
  argTypes: {
    open: {
      control: 'boolean',
    },
  },
} satisfies Meta<typeof DropdownMenu>

export default meta
type Story = StoryObj<typeof meta>

export const Open: Story = {
  render: () => (
    <div className="flex min-h-64 items-start pt-2">
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger render={<Button>Open Menu</Button>} />
        <DropdownMenuContent>
          <DropdownMenuGroup>
            <DropdownMenuLabel>My account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem>
              <CreditCard />
              Billing
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive">
              <LogOut />
              Logout
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  ),
}

export const AllVariants: Story = {
  tags: ['!chromatic'],
  render: () => (
    <div style={{ display: 'block' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h3 className="mb-4 text-lg font-semibold">Basic Menu</h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, max-content))',
            gap: '1.5rem',
            justifyItems: 'start',
          }}
        >
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button>Open Menu</Button>} />
            <DropdownMenuContent>
              <DropdownMenuItem>
                <User />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <LogOut />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h3 className="mb-4 text-lg font-semibold">With Groups</h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, max-content))',
            gap: '1.5rem',
            justifyItems: 'start',
          }}
        >
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button>Menu with Groups</Button>} />
            <DropdownMenuContent>
              <DropdownMenuGroup>
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuItem>
                  <User />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <CreditCard />
                  Billing
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem>
                  <Settings />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <LogOut />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h3 className="mb-4 text-lg font-semibold">With Submenu</h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, max-content))',
            gap: '1.5rem',
            justifyItems: 'start',
          }}
        >
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button>Menu with Submenu</Button>} />
            <DropdownMenuContent>
              <DropdownMenuItem>Item 1</DropdownMenuItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>More Options</DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem>Sub Item 1</DropdownMenuItem>
                  <DropdownMenuItem>Sub Item 2</DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuItem>Item 2</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h3 className="mb-4 text-lg font-semibold">Item States (destructive, disabled, shortcut)</h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, max-content))',
            gap: '1.5rem',
            justifyItems: 'start',
          }}
        >
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button>Item States</Button>} />
            <DropdownMenuContent>
              <DropdownMenuItem>
                <User />
                Profile
                <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem disabled>
                <Settings />
                Settings (disabled)
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive">
                <LogOut />
                Delete account
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h3 className="mb-4 text-lg font-semibold">Inset Items</h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, max-content))',
            gap: '1.5rem',
            justifyItems: 'start',
          }}
        >
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button>Inset Items</Button>} />
            <DropdownMenuContent>
              <DropdownMenuLabel inset>Appearance</DropdownMenuLabel>
              <DropdownMenuItem inset>Light</DropdownMenuItem>
              <DropdownMenuItem inset>Dark</DropdownMenuItem>
              <DropdownMenuItem inset>System</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h3 className="mb-4 text-lg font-semibold">Checkbox Items</h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, max-content))',
            gap: '1.5rem',
            justifyItems: 'start',
          }}
        >
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button>Checkbox Items</Button>} />
            <DropdownMenuContent>
              <DropdownMenuLabel>Panels</DropdownMenuLabel>
              <DropdownMenuCheckboxItem checked>Status bar</DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem>Activity bar</DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem disabled checked>
                Panel (disabled)
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-lg font-semibold">Radio Group</h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, max-content))',
            gap: '1.5rem',
            justifyItems: 'start',
          }}
        >
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button>Radio Group</Button>} />
            <DropdownMenuContent>
              <DropdownMenuLabel>Sort by</DropdownMenuLabel>
              <DropdownMenuRadioGroup value="name">
                <DropdownMenuRadioItem value="name">Name</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="date">Date</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="size" disabled>
                  Size (disabled)
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  ),
}
