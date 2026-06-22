import { fireEvent, render, screen } from '@testing-library/react'
import RenameSafeButton from '../RenameSafeButton'

describe('RenameSafeButton', () => {
  it('calls onClick when clicked', () => {
    const onClick = jest.fn()
    render(<RenameSafeButton onClick={onClick} />)
    fireEvent.click(screen.getByTestId('rename-safe-btn'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('does not bubble the click to a parent row handler', () => {
    const onClick = jest.fn()
    const parentClick = jest.fn()
    render(
      <div onClick={parentClick}>
        <RenameSafeButton onClick={onClick} />
      </div>,
    )
    fireEvent.click(screen.getByTestId('rename-safe-btn'))
    expect(onClick).toHaveBeenCalledTimes(1)
    expect(parentClick).not.toHaveBeenCalled()
  })

  it('triggers on Enter and stops propagation', () => {
    const onClick = jest.fn()
    const parentKey = jest.fn()
    render(
      <div onKeyDown={parentKey}>
        <RenameSafeButton onClick={onClick} />
      </div>,
    )
    fireEvent.keyDown(screen.getByTestId('rename-safe-btn'), { key: 'Enter' })
    expect(onClick).toHaveBeenCalledTimes(1)
    expect(parentKey).not.toHaveBeenCalled()
  })
})
