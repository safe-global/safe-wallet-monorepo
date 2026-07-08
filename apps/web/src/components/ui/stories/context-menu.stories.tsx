import type { Meta, StoryObj } from '@storybook/react'
import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from '../context-menu'
import { Copy, Scissors, Clipboard, MoreHorizontal, Trash2 } from 'lucide-react'

/**
 * ContextMenu Component Stories
 *
 * Figma: No Figma design available
 */
const meta = {
  title: 'UI/ContextMenu',
  component: ContextMenu,
  argTypes: {
    open: {
      control: 'boolean',
    },
  },
} satisfies Meta<typeof ContextMenu>

export default meta
type Story = StoryObj<typeof meta>

export const Open: Story = {
  render: () => (
    <div className="flex min-h-72 items-start p-4">
      <ContextMenu>
        <ContextMenuTrigger>
          <div
            data-testid="context-menu-zone"
            style={{ padding: '2rem', background: 'var(--muted)', borderRadius: '0.375rem' }}
          >
            Right-click here
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem>
            <Copy />
            Copy
          </ContextMenuItem>
          <ContextMenuItem>
            <Scissors />
            Cut
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem variant="destructive">
            <Trash2 />
            Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const { userEvent, within } = await import('storybook/test')
    const zone = within(canvasElement).getByTestId('context-menu-zone')
    await userEvent.pointer({ keys: '[MouseRight]', target: zone })
  },
}

export const AllVariants: Story = {
  tags: ['!chromatic'],
  render: () => (
    <div style={{ display: 'block' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h3 className="mb-4 text-lg font-semibold">Basic Context Menu</h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, max-content))',
            gap: '1.5rem',
            justifyItems: 'start',
          }}
        >
          <div
            style={{
              width: '300px',
              padding: '2rem',
              border: '1px solid var(--border)',
              borderRadius: '0.375rem',
              textAlign: 'center',
            }}
          >
            <ContextMenu>
              <ContextMenuTrigger>
                <div style={{ padding: '1rem', background: 'var(--muted)', borderRadius: '0.375rem' }}>
                  Right-click here
                </div>
              </ContextMenuTrigger>
              <ContextMenuContent>
                <ContextMenuItem>
                  <Copy />
                  Copy
                </ContextMenuItem>
                <ContextMenuItem>
                  <Scissors />
                  Cut
                </ContextMenuItem>
                <ContextMenuItem>
                  <Clipboard />
                  Paste
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem>Delete</ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-lg font-semibold">With Groups</h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, max-content))',
            gap: '1.5rem',
            justifyItems: 'start',
          }}
        >
          <div
            style={{
              width: '300px',
              padding: '2rem',
              border: '1px solid var(--border)',
              borderRadius: '0.375rem',
              textAlign: 'center',
            }}
          >
            <ContextMenu>
              <ContextMenuTrigger>
                <div style={{ padding: '1rem', background: 'var(--muted)', borderRadius: '0.375rem' }}>
                  Right-click for groups
                </div>
              </ContextMenuTrigger>
              <ContextMenuContent>
                <ContextMenuGroup>
                  <ContextMenuLabel>Edit</ContextMenuLabel>
                  <ContextMenuItem>
                    <Copy />
                    Copy
                  </ContextMenuItem>
                  <ContextMenuItem>
                    <Scissors />
                    Cut
                  </ContextMenuItem>
                </ContextMenuGroup>
                <ContextMenuSeparator />
                <ContextMenuGroup>
                  <ContextMenuItem>
                    <MoreHorizontal />
                    More options
                  </ContextMenuItem>
                </ContextMenuGroup>
              </ContextMenuContent>
            </ContextMenu>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <h3 className="mb-4 text-lg font-semibold">Item Variants & States</h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, max-content))',
            gap: '1.5rem',
            justifyItems: 'start',
          }}
        >
          <div
            style={{
              width: '300px',
              padding: '2rem',
              border: '1px solid var(--border)',
              borderRadius: '0.375rem',
              textAlign: 'center',
            }}
          >
            <ContextMenu>
              <ContextMenuTrigger>
                <div style={{ padding: '1rem', background: 'var(--muted)', borderRadius: '0.375rem' }}>
                  Right-click for variants
                </div>
              </ContextMenuTrigger>
              <ContextMenuContent>
                <ContextMenuItem>
                  <Copy />
                  Copy
                  <ContextMenuShortcut>⌘C</ContextMenuShortcut>
                </ContextMenuItem>
                <ContextMenuItem disabled>
                  <Clipboard />
                  Paste (disabled)
                </ContextMenuItem>
                <ContextMenuItem inset>Inset item</ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem variant="destructive">
                  <Trash2 />
                  Delete
                  <ContextMenuShortcut>⌫</ContextMenuShortcut>
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <h3 className="mb-4 text-lg font-semibold">Checkbox & Radio Items</h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, max-content))',
            gap: '1.5rem',
            justifyItems: 'start',
          }}
        >
          <div
            style={{
              width: '300px',
              padding: '2rem',
              border: '1px solid var(--border)',
              borderRadius: '0.375rem',
              textAlign: 'center',
            }}
          >
            <ContextMenu>
              <ContextMenuTrigger>
                <div style={{ padding: '1rem', background: 'var(--muted)', borderRadius: '0.375rem' }}>
                  Right-click for selection
                </div>
              </ContextMenuTrigger>
              <ContextMenuContent>
                <ContextMenuLabel>Appearance</ContextMenuLabel>
                <ContextMenuCheckboxItem checked>Show toolbar</ContextMenuCheckboxItem>
                <ContextMenuCheckboxItem>Show sidebar</ContextMenuCheckboxItem>
                <ContextMenuSeparator />
                <ContextMenuLabel>Sort by</ContextMenuLabel>
                <ContextMenuRadioGroup defaultValue="name">
                  <ContextMenuRadioItem value="name">Name</ContextMenuRadioItem>
                  <ContextMenuRadioItem value="date">Date</ContextMenuRadioItem>
                  <ContextMenuRadioItem value="size">Size</ContextMenuRadioItem>
                </ContextMenuRadioGroup>
              </ContextMenuContent>
            </ContextMenu>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <h3 className="mb-4 text-lg font-semibold">With Submenu</h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, max-content))',
            gap: '1.5rem',
            justifyItems: 'start',
          }}
        >
          <div
            style={{
              width: '300px',
              padding: '2rem',
              border: '1px solid var(--border)',
              borderRadius: '0.375rem',
              textAlign: 'center',
            }}
          >
            <ContextMenu>
              <ContextMenuTrigger>
                <div style={{ padding: '1rem', background: 'var(--muted)', borderRadius: '0.375rem' }}>
                  Right-click for submenu
                </div>
              </ContextMenuTrigger>
              <ContextMenuContent>
                <ContextMenuItem>
                  <Copy />
                  Copy
                </ContextMenuItem>
                <ContextMenuSub>
                  <ContextMenuSubTrigger>
                    <MoreHorizontal />
                    More options
                  </ContextMenuSubTrigger>
                  <ContextMenuSubContent>
                    <ContextMenuItem>
                      <Scissors />
                      Cut
                    </ContextMenuItem>
                    <ContextMenuItem>
                      <Clipboard />
                      Paste
                    </ContextMenuItem>
                  </ContextMenuSubContent>
                </ContextMenuSub>
              </ContextMenuContent>
            </ContextMenu>
          </div>
        </div>
      </div>
    </div>
  ),
}
