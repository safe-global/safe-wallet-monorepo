import { render } from '@testing-library/react'
import { Combobox, ComboboxInput } from './combobox'

describe('ComboboxInput', () => {
  let consoleError: jest.SpyInstance

  beforeEach(() => {
    consoleError = jest.spyOn(console, 'error')
  })

  afterEach(() => {
    consoleError.mockRestore()
  })

  it('renders the trigger as a single native button', () => {
    const { container } = render(
      <Combobox items={['ETH', 'USDC']}>
        <ComboboxInput placeholder="Token" />
      </Combobox>,
    )

    const buttons = container.querySelectorAll('button')
    expect(buttons).toHaveLength(1)
    expect(buttons[0]).toHaveAttribute('data-slot', 'input-group-button')
    expect(buttons[0]).not.toHaveAttribute('role')
    expect(consoleError).not.toHaveBeenCalledWith(expect.stringContaining('nativeButton'))
  })
})
