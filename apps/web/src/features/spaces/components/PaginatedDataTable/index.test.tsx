import { render, screen, fireEvent } from '@testing-library/react'
import PaginatedDataTable, { type DataTableColumn } from './index'

const columns: DataTableColumn[] = [{ id: 'value', header: 'Value' }]

const tableElement = (rows: string[], pageSize?: number) => (
  <PaginatedDataTable
    columns={columns}
    rows={rows}
    pageSize={pageSize}
    getRowKey={(row) => row}
    renderRow={(row) => <td>{row}</td>}
  />
)

describe('PaginatedDataTable', () => {
  it('renders the column headers', () => {
    render(tableElement(['a', 'b']))

    expect(screen.getByText('Value')).toBeInTheDocument()
  })

  it('renders every row and no pagination when below the page size', () => {
    render(tableElement(['a', 'b', 'c']))

    expect(screen.getByText('a')).toBeInTheDocument()
    expect(screen.getByText('c')).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('paginates and shows the visible range when rows exceed the page size', () => {
    render(tableElement(['a', 'b', 'c'], 2))

    expect(screen.getByText('a')).toBeInTheDocument()
    expect(screen.getByText('b')).toBeInTheDocument()
    expect(screen.queryByText('c')).not.toBeInTheDocument()
    expect(screen.getByText('1–2 of 3')).toBeInTheDocument()
  })

  it('navigates between pages', () => {
    render(tableElement(['a', 'b', 'c'], 2))

    const [prev, next] = screen.getAllByRole('button')
    expect(prev).toBeDisabled()

    fireEvent.click(next)

    expect(screen.getByText('c')).toBeInTheDocument()
    expect(screen.queryByText('a')).not.toBeInTheDocument()
    expect(screen.getByText('3–3 of 3')).toBeInTheDocument()
    expect(next).toBeDisabled()
  })

  it('resets to the first page when the rows change', () => {
    const { rerender } = render(tableElement(['a', 'b', 'c'], 2))

    fireEvent.click(screen.getAllByRole('button')[1]!)
    expect(screen.getByText('c')).toBeInTheDocument()

    rerender(tableElement(['x', 'y', 'z'], 2))

    expect(screen.getByText('x')).toBeInTheDocument()
    expect(screen.queryByText('z')).not.toBeInTheDocument()
  })
})
