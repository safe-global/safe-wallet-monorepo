import { act, fireEvent, render, screen } from '@/tests/test-utils'
import DesignFeedback from './DesignFeedback'

const TARGET = { workspace: 'safe-global', ticket: 'DES-1', team: 'DES', project: 'Design feedback' }

describe('DesignFeedback', () => {
  it('starts comment mode with C and reports it to the page', () => {
    const onActiveChange = jest.fn()
    render(<DesignFeedback target={TARGET} onActiveChange={onActiveChange} />)

    act(() => {
      fireEvent.keyDown(window, { key: 'c' })
    })

    expect(screen.getByRole('button', { name: 'Cancel comment' })).toHaveAttribute('aria-pressed', 'true')
    expect(onActiveChange).toHaveBeenLastCalledWith(true)
  })

  it('ignores C while the user types in a field', () => {
    render(
      <>
        <input aria-label="Search" />
        <DesignFeedback target={TARGET} />
      </>,
    )

    fireEvent.keyDown(screen.getByRole('textbox', { name: 'Search' }), { key: 'c' })

    expect(screen.getByRole('button', { name: 'Add a comment' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('turns comment mode off from the button', () => {
    render(<DesignFeedback target={TARGET} />)
    const button = screen.getByRole('button', { name: 'Add a comment' })

    fireEvent.click(button)
    expect(screen.getByRole('button', { name: 'Cancel comment' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Cancel comment' }))
    expect(screen.getByRole('button', { name: 'Add a comment' })).toBeInTheDocument()
  })
})
