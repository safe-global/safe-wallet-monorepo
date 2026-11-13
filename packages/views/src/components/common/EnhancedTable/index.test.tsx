import { fireEvent, render, renderWithUserEvent } from '@/tests/test-utils'
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

  const manyRows = (count: number) =>
    Array.from({ length: count }, (_, i) => ({
      key: String(i),
      cells: { name: { content: `row ${i}`, rawValue: i }, value: { content: '', rawValue: i } },
    }))

  it('hides the pagination controls when every row fits on the smallest page', () => {
    const { queryByTestId } = render(<EnhancedTable headCells={headCells} rows={manyRows(10)} />)

    expect(queryByTestId('table-pagination')).not.toBeInTheDocument()
  })

  it('shows the pagination controls once the rows exceed the smallest page size', () => {
    const { getByTestId } = render(<EnhancedTable headCells={headCells} rows={manyRows(11)} />)

    expect(getByTestId('table-pagination')).toBeInTheDocument()
  })

  it('shows 25 rows on the first page and pages through the rest', () => {
    const { getAllByTestId, getByTestId, getByText } = render(
      <EnhancedTable headCells={headCells} rows={manyRows(28)} />,
    )

    expect(getAllByTestId('table-row')).toHaveLength(25)
    expect(getByText('1–25 of 28')).toBeInTheDocument()
    expect(getByTestId('prev-page-btn')).toBeDisabled()

    fireEvent.click(getByTestId('next-page-btn'))

    expect(getAllByTestId('table-row')).toHaveLength(3)
    expect(getByText('26–28 of 28')).toBeInTheDocument()
    expect(getByTestId('next-page-btn')).toBeDisabled()
  })

  it('changes the page size and goes back to the first page', async () => {
    const { user, getAllByTestId, getByTestId, findByRole, findByText, getByText } = renderWithUserEvent(
      <EnhancedTable headCells={headCells} rows={manyRows(28)} />,
    )

    await user.click(getByTestId('next-page-btn'))
    await user.click(getByTestId('rows-per-page'))
    await user.click(await findByRole('option', { name: '10' }))

    expect(await findByText('1–10 of 28')).toBeInTheDocument()
    expect(getAllByTestId('table-row')).toHaveLength(10)

    await user.click(getByTestId('next-page-btn'))
    await user.click(getByTestId('next-page-btn'))

    expect(getByText('21–28 of 28')).toBeInTheDocument()
    expect(getAllByTestId('table-row')).toHaveLength(8)

    await user.click(getByTestId('prev-page-btn'))

    expect(getByText('11–20 of 28')).toBeInTheDocument()
    expect(getAllByTestId('table-row')).toHaveLength(10)
  })

  describe('sorting', () => {
    const rowsNamed = (names: Array<string | number>) =>
      names.map((name) => ({
        key: String(name),
        cells: { name: { content: String(name), rawValue: name }, value: { content: '', rawValue: '' } },
      }))

    const shownNames = (getAllByTestId: (id: string) => HTMLElement[]) =>
      getAllByTestId('table-cell-name').map((cell) => cell.textContent)

    it('sorts rows by a column ascending, then descending on a second click', () => {
      const { getAllByTestId, getByRole } = render(
        <EnhancedTable headCells={headCells} rows={rowsNamed(['b', 'c', 'a'])} />,
      )

      expect(shownNames(getAllByTestId)).toEqual(['b', 'c', 'a'])

      fireEvent.click(getByRole('button', { name: /Name/ }))

      expect(shownNames(getAllByTestId)).toEqual(['a', 'b', 'c'])
      expect(getByRole('columnheader', { name: /Name/ })).toHaveAttribute('aria-sort', 'ascending')

      fireEvent.click(getByRole('button', { name: /Name/ }))

      expect(shownNames(getAllByTestId)).toEqual(['c', 'b', 'a'])
      expect(getByRole('columnheader', { name: /Name/ })).toHaveAttribute('aria-sort', 'descending')
    })

    it('sorts numeric values by size, not as text', () => {
      const { getAllByTestId, getByRole } = render(
        <EnhancedTable headCells={headCells} rows={rowsNamed([9, 100, 10])} />,
      )

      fireEvent.click(getByRole('button', { name: /Name/ }))

      expect(shownNames(getAllByTestId)).toEqual(['9', '10', '100'])
    })
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

    it('keeps the hover pill off the empty placeholder row', () => {
      const { container } = render(<EnhancedTable headCells={headCells} rows={[]} panel />)

      expect(container.querySelector('tbody tr')).toHaveAttribute('data-no-hover')
    })
  })
})
