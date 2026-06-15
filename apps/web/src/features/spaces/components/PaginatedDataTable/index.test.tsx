import { render, screen, fireEvent } from '@testing-library/react'
import PaginatedDataTable, { type DataTableColumn } from './index'

const mockUseIsMobile = jest.fn(() => false)
jest.mock('@/hooks/use-mobile', () => ({ useIsMobile: () => mockUseIsMobile() }))

const columns: DataTableColumn<string>[] = [{ id: 'value', header: 'Value' }]

const tableElement = (rows: string[], pageSize?: number) => (
  <PaginatedDataTable
    columns={columns}
    rows={rows}
    pageSize={pageSize}
    getRowKey={(row) => row}
    renderCell={(row) => row}
  />
)

beforeEach(() => {
  mockUseIsMobile.mockReturnValue(false)
})

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

    const prev = screen.getByRole('button', { name: 'Previous page' })
    const next = screen.getByRole('button', { name: 'Next page' })
    expect(prev).toBeDisabled()

    fireEvent.click(next)

    expect(screen.getByText('c')).toBeInTheDocument()
    expect(screen.queryByText('a')).not.toBeInTheDocument()
    expect(screen.getByText('3–3 of 3')).toBeInTheDocument()
    expect(next).toBeDisabled()
  })

  it('resets to the first page when the rows change', () => {
    const { rerender } = render(tableElement(['a', 'b', 'c'], 2))

    fireEvent.click(screen.getByRole('button', { name: 'Next page' }))
    expect(screen.getByText('c')).toBeInTheDocument()

    rerender(tableElement(['x', 'y', 'z'], 2))

    expect(screen.getByText('x')).toBeInTheDocument()
    expect(screen.queryByText('z')).not.toBeInTheDocument()
  })

  describe('sorting', () => {
    const sortableColumns: DataTableColumn<{ name: string }>[] = [
      { id: 'name', header: 'Name', sortValue: (row) => row.name },
    ]

    const renderSortable = () =>
      render(
        <PaginatedDataTable
          columns={sortableColumns}
          rows={[{ name: 'Charlie' }, { name: 'Alice' }, { name: 'Bob' }]}
          getRowKey={(row) => row.name}
          renderCell={(row) => row.name}
        />,
      )

    const cellTexts = () => screen.getAllByRole('cell').map((cell) => cell.textContent)

    it('does not render a header button for non-sortable columns', () => {
      render(tableElement(['a', 'b']))

      expect(screen.queryByRole('button', { name: /Value/ })).not.toBeInTheDocument()
    })

    it('cycles ascending → descending → unsorted on repeated clicks', () => {
      renderSortable()

      const header = screen.getByRole('button', { name: /Name/ })

      expect(cellTexts()).toEqual(['Charlie', 'Alice', 'Bob'])

      fireEvent.click(header)
      expect(cellTexts()).toEqual(['Alice', 'Bob', 'Charlie'])

      fireEvent.click(header)
      expect(cellTexts()).toEqual(['Charlie', 'Bob', 'Alice'])

      fireEvent.click(header)
      expect(cellTexts()).toEqual(['Charlie', 'Alice', 'Bob'])
    })
  })

  describe('responsive behaviour', () => {
    type Row = { name: string; email: string }
    const responsiveColumns: DataTableColumn<Row>[] = [
      { id: 'name', header: 'Name', sticky: true, minWidth: 200, sortValue: (r) => r.name },
      { id: 'email', header: 'Email', priority: 'secondary', sortValue: (r) => r.email },
    ]
    const rows: Row[] = [
      { name: 'Alice', email: 'a@example.io' },
      { name: 'Bob', email: 'b@example.io' },
    ]

    const renderResponsive = (withDetail = false) =>
      render(
        <PaginatedDataTable
          columns={responsiveColumns}
          rows={rows}
          getRowKey={(r) => r.name}
          renderCell={(r, c) => (c.id === 'name' ? r.name : r.email)}
          renderRowDetail={withDetail ? (r) => <span>detail-{r.name}</span> : undefined}
        />,
      )

    it('marks secondary columns with the mobile-hide class on header and body cells', () => {
      renderResponsive()

      expect(screen.getByText('Email').closest('th')).toHaveClass('max-[767px]:hidden')
      expect(screen.getByText('a@example.io').closest('td')).toHaveClass('max-[767px]:hidden')
    })

    it('applies sticky classes and minWidth to both the header and body cells of a sticky column', () => {
      renderResponsive()

      const nameHeader = screen.getByText('Name').closest('th')
      const nameCell = screen.getByText('Alice').closest('td')

      expect(nameHeader).toHaveClass('max-[767px]:sticky', 'max-[767px]:left-0')
      expect(nameHeader).toHaveStyle({ minWidth: '200px' })
      expect(nameCell).toHaveClass('max-[767px]:sticky', 'max-[767px]:left-0')
      expect(nameCell).toHaveStyle({ minWidth: '200px' })
    })

    it('adds no separate mobile sort control and keeps sorting on the visible headers', () => {
      mockUseIsMobile.mockReturnValue(true)
      renderResponsive()

      // No standalone "Sort by" dropdown or direction toggle on mobile
      expect(screen.queryByRole('button', { name: 'Sort ascending' })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Sort by' })).not.toBeInTheDocument()

      // The visible Name header is still a working sort control on mobile
      const nameHeader = screen.getByRole('button', { name: /Name/ })
      fireEvent.click(nameHeader)
      expect(nameHeader.closest('th')).toHaveAttribute('aria-sort', 'ascending')
    })

    it('does not render the detail toggle on desktop', () => {
      renderResponsive(true)

      expect(screen.queryByRole('button', { name: 'Show details' })).not.toBeInTheDocument()
    })

    it('expands and collapses the mobile detail row', () => {
      mockUseIsMobile.mockReturnValue(true)
      renderResponsive(true)

      const toggles = screen.getAllByRole('button', { name: 'Show details' })
      expect(toggles).toHaveLength(2)
      expect(screen.queryByText('detail-Alice')).not.toBeInTheDocument()

      fireEvent.click(toggles[0]!)

      expect(screen.getByText('detail-Alice')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Hide details' })).toHaveAttribute('aria-expanded', 'true')

      fireEvent.click(screen.getByRole('button', { name: 'Hide details' }))
      expect(screen.queryByText('detail-Alice')).not.toBeInTheDocument()
    })
  })
})
