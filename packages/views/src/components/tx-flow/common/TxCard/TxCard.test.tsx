import { render, screen } from '@testing-library/react'
import TxCard, { TxCardActions } from './index'

describe('TxCard', () => {
  it('should, by default, use the standard content padding only', () => {
    render(<TxCard>content</TxCard>)

    expect(screen.getByTestId('card-content')).toHaveClass('cardContent')
    expect(screen.getByTestId('card-content')).not.toHaveClass('cardContentCompactBottom')
  })

  it('should, with compactBottom content padding, add the compact bottom padding class', () => {
    render(<TxCard contentPadding="compactBottom">content</TxCard>)

    expect(screen.getByTestId('card-content')).toHaveClass('cardContent', 'cardContentCompactBottom')
  })
})

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
