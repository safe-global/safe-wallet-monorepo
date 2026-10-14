import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ExportDialog from '../ExportDialog'

describe('ExportDialog', () => {
  it('disables Selected when no contact is selected', () => {
    render(
      <ExportDialog counts={{ all: 12, 'current-view': 5, selected: 0 }} onExport={jest.fn()} onClose={jest.fn()} />,
    )

    expect(screen.getByLabelText(/Selected/)).toBeDisabled()
    expect(screen.getByLabelText(/All contacts/)).toBeChecked()
  })

  it('falls back to all contacts when opened on an empty selection', () => {
    render(
      <ExportDialog
        counts={{ all: 12, 'current-view': 5, selected: 0 }}
        initialScope="selected"
        onExport={jest.fn()}
        onClose={jest.fn()}
      />,
    )

    expect(screen.getByTestId('export-btn')).toHaveTextContent('Export 12 contacts')
  })

  it('exports the chosen scope and counts it in the button', async () => {
    const onExport = jest.fn()
    render(
      <ExportDialog counts={{ all: 12, 'current-view': 5, selected: 1 }} onExport={onExport} onClose={jest.fn()} />,
    )

    await userEvent.click(screen.getByLabelText(/Selected/))
    expect(screen.getByTestId('export-btn')).toHaveTextContent('Export 1 contact')

    await userEvent.click(screen.getByLabelText(/Current view/))
    expect(screen.getByTestId('export-btn')).toHaveTextContent('Export 5 contacts')

    await userEvent.click(screen.getByTestId('export-btn'))
    expect(onExport).toHaveBeenCalledWith('current-view')
  })
})
