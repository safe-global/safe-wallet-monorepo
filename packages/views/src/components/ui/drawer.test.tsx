import type { ComponentProps } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ShadcnProvider } from './ShadcnProvider'
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle, DrawerTrigger } from './drawer'

type DrawerProps = ComponentProps<typeof Drawer>

const renderDrawer = (props: DrawerProps) =>
  render(
    <ShadcnProvider>
      <Drawer {...props}>
        <DrawerTrigger>Open preview</DrawerTrigger>
        <DrawerContent>
          <DrawerTitle>App preview</DrawerTitle>
          <DrawerDescription>Details of the app</DrawerDescription>
        </DrawerContent>
      </Drawer>
    </ShadcnProvider>,
  )

describe('Drawer', () => {
  it('renders an open drawer as a labelled dialog inside the shadcn portal container', () => {
    renderDrawer({ open: true })

    const dialog = screen.getByRole('dialog', { name: 'App preview' })

    expect(dialog).toHaveAccessibleDescription('Details of the app')
    expect(dialog).toHaveAttribute('data-open')
    expect(dialog.closest('.shadcn-scope')).not.toBeNull()
  })

  it.each([
    ['top', 'up'],
    ['right', 'right'],
    ['bottom', 'down'],
    ['left', 'left'],
  ] as const)('marks a drawer from the %s edge with swipe direction %s', (direction, swipeDirection) => {
    renderDrawer({ open: true, direction })

    expect(screen.getByRole('dialog')).toHaveAttribute('data-swipe-direction', swipeDirection)
  })

  it('opens from the bottom edge when no direction is given', () => {
    renderDrawer({ open: true })

    expect(screen.getByRole('dialog')).toHaveAttribute('data-swipe-direction', 'down')
  })

  it('opens when the trigger is pressed', async () => {
    const user = userEvent.setup()
    renderDrawer({})

    await user.click(screen.getByRole('button', { name: 'Open preview' }))

    expect(await screen.findByRole('dialog', { name: 'App preview' })).toBeInTheDocument()
  })

  it('asks to close when Escape is pressed', async () => {
    const user = userEvent.setup()
    const onOpenChange = jest.fn()
    renderDrawer({ open: true, onOpenChange })

    await user.keyboard('{Escape}')

    expect(onOpenChange).toHaveBeenCalledWith(false, expect.objectContaining({ reason: 'escape-key' }))
  })

  it('asks to close when the area outside the panel is clicked', async () => {
    const user = userEvent.setup()
    const onOpenChange = jest.fn()
    renderDrawer({ open: true, direction: 'right', onOpenChange })

    const outsideThePanel = document.querySelector('[data-slot="drawer-viewport"]')
    if (!(outsideThePanel instanceof HTMLElement)) throw new Error('Drawer viewport is not rendered')
    await user.click(outsideThePanel)

    expect(onOpenChange).toHaveBeenCalledWith(false, expect.objectContaining({ reason: 'outside-press' }))
  })
})
