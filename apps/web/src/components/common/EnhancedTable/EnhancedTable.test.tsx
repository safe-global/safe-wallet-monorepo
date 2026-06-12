import { render, screen, fireEvent } from '@testing-library/react'
import EnhancedTable, { type EnhancedTableProps } from './index'

const headCells: EnhancedTableProps['headCells'] = [{ id: 'name', label: 'Name' }]

const makeRows = (n: number): EnhancedTableProps['rows'] =>
  Array.from({ length: n }, (_, i) => ({
    key: `row-${i}`,
    cells: { name: { rawValue: `row-${i}`, content: `row-${i}` } },
  }))

describe('EnhancedTable', () => {
  it('hides pagination at or below the smallest page size', () => {
    render(<EnhancedTable rows={makeRows(10)} headCells={headCells} />)

    expect(screen.queryByTestId('table-pagination')).not.toBeInTheDocument()
  })

  it('shows pagination once rows exceed the smallest page size', () => {
    render(<EnhancedTable rows={makeRows(11)} headCells={headCells} />)

    expect(screen.getByTestId('table-pagination')).toBeInTheDocument()
  })

  it('clamps an out-of-range page when rows shrink, instead of rendering an empty body', () => {
    const { rerender } = render(<EnhancedTable rows={makeRows(30)} headCells={headCells} />)

    // Default page size is 25 -> first page shows 25 rows
    expect(screen.getAllByTestId('table-row')).toHaveLength(25)

    // Navigate to the second page (rows 26-30)
    fireEvent.click(screen.getByLabelText('Go to next page'))
    expect(screen.getAllByTestId('table-row')).toHaveLength(5)

    // Rows shrink (e.g. a search filter) to 3 while still on the second page
    rerender(<EnhancedTable rows={makeRows(3)} headCells={headCells} />)

    // Page is clamped back into range: all 3 rows render, no empty fallback
    expect(screen.getAllByTestId('table-row')).toHaveLength(3)
    expect(screen.getByText('row-0')).toBeInTheDocument()
  })

  it('keeps the range label in sync when a clamp happens with pagination still visible', () => {
    const { rerender } = render(<EnhancedTable rows={makeRows(30)} headCells={headCells} />)

    fireEvent.click(screen.getByLabelText('Go to next page'))

    // Shrink to 20 (still > 10, so pagination stays visible) while on page 2
    rerender(<EnhancedTable rows={makeRows(20)} headCells={headCells} />)

    expect(screen.getAllByTestId('table-row')).toHaveLength(20)
    expect(screen.getByText('1–20 of 20')).toBeInTheDocument()
  })
})
