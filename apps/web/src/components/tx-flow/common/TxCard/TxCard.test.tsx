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
})
