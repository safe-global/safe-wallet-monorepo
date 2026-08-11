import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './collapsible'

/**
 * Base UI's trigger defaults to `nativeButton: true`. When the trigger is rendered as something
 * other than a <button> that default keeps the native-button code path, so no `role="button"` and no
 * Enter/Space handling are applied — the element is focusable but cannot be activated by keyboard.
 *
 * MultiAccountItem hit exactly this: the multi-chain group header on the accounts list could be
 * tabbed to but never expanded, putting every Safe in the group out of reach without a mouse.
 */
const DivTrigger = ({ nativeButton }: { nativeButton?: boolean }) => (
  <Collapsible>
    <CollapsibleTrigger data-testid="trigger" nativeButton={nativeButton} render={<div />}>
      Toggle
    </CollapsibleTrigger>
    <CollapsibleContent>Panel body</CollapsibleContent>
  </Collapsible>
)

describe('CollapsibleTrigger rendered as a div', () => {
  it('exposes a button role when nativeButton is false', () => {
    render(<DivTrigger nativeButton={false} />)

    expect(screen.getByTestId('trigger')).toHaveAttribute('role', 'button')
  })

  it('expands on Enter', async () => {
    render(<DivTrigger nativeButton={false} />)

    screen.getByTestId('trigger').focus()
    await userEvent.keyboard('{Enter}')

    expect(await screen.findByText('Panel body')).toBeInTheDocument()
  })

  it('expands on Space', async () => {
    render(<DivTrigger nativeButton={false} />)

    screen.getByTestId('trigger').focus()
    await userEvent.keyboard('[Space]')

    expect(await screen.findByText('Panel body')).toBeInTheDocument()
  })

  it('is not keyboard-operable when nativeButton is left at its default', () => {
    // Documents the trap rather than endorsing it: this is the shape that shipped.
    render(<DivTrigger />)

    expect(screen.getByTestId('trigger')).not.toHaveAttribute('role', 'button')
  })
})
