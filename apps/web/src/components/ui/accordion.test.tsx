import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './accordion'

/**
 * Base UI's trigger defaults to `nativeButton: true`. When the trigger is rendered as something
 * other than a <button> that default keeps the native-button code path, so no `role="button"` and no
 * Enter/Space handling are applied — the element is focusable but cannot be activated by keyboard.
 *
 * Mirrors collapsible.test.tsx. SingleTxDecoded (each action of a MultiSend/batch transaction) and
 * RecoveryListItem both shipped div triggers without the prop, so a keyboard-only user could not
 * expand a row to see what they were about to sign.
 */
const DivTrigger = ({ nativeButton }: { nativeButton?: boolean }) => (
  <Accordion>
    <AccordionItem value="item">
      <AccordionTrigger data-testid="trigger" nativeButton={nativeButton} render={<div />}>
        Toggle
      </AccordionTrigger>
      <AccordionContent>Panel body</AccordionContent>
    </AccordionItem>
  </Accordion>
)

describe('AccordionTrigger rendered as a div', () => {
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
