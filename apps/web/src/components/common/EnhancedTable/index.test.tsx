import { render } from '@/tests/test-utils'
import EnhancedTable from './index'

const headCells = [
  { id: 'name', label: 'Name' },
  { id: 'value', label: 'Value', disableSort: true },
]

const rows = ['a', 'b', 'c'].map((value) => ({
  key: value,
  cells: {
    name: { content: value, rawValue: value },
    value: { content: value.toUpperCase(), rawValue: value },
  },
}))

describe('EnhancedTable', () => {
  it('renders the head cells and one row per entry', () => {
    const { getAllByTestId, getByText } = render(<EnhancedTable headCells={headCells} rows={rows} />)

    expect(getByText('Name')).toBeInTheDocument()
    expect(getAllByTestId('table-row')).toHaveLength(3)
  })

  // The panel variant renders inside a surface its parent draws, so the table brings no card chrome.
  describe('panel', () => {
    const surface = (container: HTMLElement) =>
      container.querySelector('[data-testid="table-container"]')?.className ?? ''

    it('draws its own card chrome by default', () => {
      const { container } = render(<EnhancedTable headCells={headCells} rows={rows} />)

      expect(surface(container)).toContain('bg-[var(--color-background-paper)]')
    })

    it('drops the chrome when panelled', () => {
      const { container } = render(<EnhancedTable headCells={headCells} rows={rows} panel />)

      expect(surface(container)).not.toContain('bg-[var(--color-background-paper)]')
    })
  })
})
