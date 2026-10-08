import { render, screen, fireEvent } from '@/tests/test-utils'
import AccountItemButton from '../AccountItemButton'

describe('AccountItemButton', () => {
  it('fires onClick on click', () => {
    const onClick = jest.fn()
    render(<AccountItemButton onClick={onClick}>row content</AccountItemButton>)

    fireEvent.click(screen.getByTestId('safe-list-item'))

    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('fires onClick on Enter', () => {
    const onClick = jest.fn()
    render(<AccountItemButton onClick={onClick}>row content</AccountItemButton>)

    fireEvent.keyDown(screen.getByTestId('safe-list-item'), { key: 'Enter' })

    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('fires onClick on Space', () => {
    const onClick = jest.fn()
    render(<AccountItemButton onClick={onClick}>row content</AccountItemButton>)

    fireEvent.keyDown(screen.getByTestId('safe-list-item'), { key: ' ' })

    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('ignores key presses originating from focusable children', () => {
    const onClick = jest.fn()
    render(
      <AccountItemButton onClick={onClick}>
        <button>child action</button>
      </AccountItemButton>,
    )

    fireEvent.keyDown(screen.getByText('child action'), { key: 'Enter' })

    expect(onClick).not.toHaveBeenCalled()
  })
})
