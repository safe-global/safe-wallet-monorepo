import { fireEvent, render, screen } from '@/tests/test-utils'
import { DataWidget } from '.'

describe('DataWidget', () => {
  it('opens the import dialog from the Import button', () => {
    render(<DataWidget />)

    expect(screen.queryByTestId('dialog-import-btn')).not.toBeInTheDocument()

    fireEvent.click(screen.getByTestId('import-btn'))

    expect(screen.getByTestId('dialog-import-btn')).toBeInTheDocument()
  })
})
