import { render } from '@testing-library/react'
import { TxCardActions } from './index'

describe('TxCardActions', () => {
  it('accepts an explicit spacing override for review flows', () => {
    const { container } = render(
      <TxCardActions className="!mt-0">
        <button type="button">Continue</button>
      </TxCardActions>,
    )

    expect(container.firstChild).toHaveClass('txCardActions', '!mt-0')
  })

  it('should, when rendered, keep the actions in a right-aligned row that is not full width', () => {
    const { container } = render(
      <TxCardActions>
        <button type="button">Continue</button>
      </TxCardActions>,
    )

    const row = container.firstElementChild
    const actions = row?.firstElementChild
    expect(row).toHaveClass('flex', 'justify-end')
    expect(actions).toHaveClass('flex-row')
    expect(actions?.className).not.toMatch(/flex-col|w-full/)
  })
})
