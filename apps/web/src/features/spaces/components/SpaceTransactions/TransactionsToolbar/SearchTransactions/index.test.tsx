import { act, fireEvent, render, screen } from '@/tests/test-utils'
import SearchTransactions, { SEARCH_DEBOUNCE_MS } from '.'

describe('SearchTransactions', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  const searchbox = () => screen.getByRole('searchbox', { name: 'Search transactions' })

  it('shows each keystroke at once but searches only once typing pauses, trimmed', () => {
    const onSearch = jest.fn()
    render(<SearchTransactions onSearch={onSearch} />)

    fireEvent.change(searchbox(), { target: { value: ' treas' } })
    fireEvent.change(searchbox(), { target: { value: ' treasury ' } })

    expect(searchbox()).toHaveValue(' treasury ')
    expect(onSearch).not.toHaveBeenCalled()

    act(() => {
      jest.advanceTimersByTime(SEARCH_DEBOUNCE_MS)
    })

    expect(onSearch).toHaveBeenCalledTimes(1)
    expect(onSearch).toHaveBeenCalledWith('treasury')
  })

  it('clears the search at once, dropping a pending one', () => {
    const onSearch = jest.fn()
    render(<SearchTransactions onSearch={onSearch} />)

    fireEvent.change(searchbox(), { target: { value: 'polygon' } })
    fireEvent.click(screen.getByRole('button', { name: 'Clear search' }))

    expect(searchbox()).toHaveValue('')
    expect(onSearch).toHaveBeenCalledWith('')

    act(() => {
      jest.advanceTimersByTime(SEARCH_DEBOUNCE_MS)
    })

    expect(onSearch).toHaveBeenCalledTimes(1)
  })
})
