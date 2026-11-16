import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ImportDialog from '../ImportDialog'

const renderDialog = (props: { suggestionCount?: number; onViewSuggestions?: () => void } = {}) =>
  render(
    <ImportDialog
      onFileSelected={jest.fn()}
      onConfirm={jest.fn()}
      onBack={jest.fn()}
      onClose={jest.fn()}
      onViewSuggestions={jest.fn()}
      {...props}
    />,
  )

describe('ImportDialog', () => {
  it('hides View suggestions when there are no suggestions', () => {
    renderDialog({ suggestionCount: 0 })

    expect(screen.queryByRole('button', { name: 'View suggestions' })).not.toBeInTheDocument()
  })

  it('offers View suggestions when suggestions are waiting', async () => {
    const onViewSuggestions = jest.fn()
    renderDialog({ suggestionCount: 3, onViewSuggestions })

    expect(screen.getByText(/3 suggested contacts are waiting/)).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'View suggestions' }))

    expect(onViewSuggestions).toHaveBeenCalledTimes(1)
  })
})
