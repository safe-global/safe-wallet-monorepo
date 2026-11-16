import { act, fireEvent, render, screen } from '@/tests/test-utils'
import SearchTransactions from '.'

describe('SearchTransactions', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  const searchbox = () => screen.getByRole('searchbox', { name: 'Search transactions' })

  const advance = (ms: number) =>
    act(() => {
      jest.advanceTimersByTime(ms)
    })

  it('shows each keystroke at once', () => {
    render(<SearchTransactions onSearch={jest.fn()} />)

    fireEvent.change(searchbox(), { target: { value: 'treas' } })

    expect(searchbox()).toHaveValue('treas')
  })

  it('searches only once typing pauses', () => {
    const onSearch = jest.fn()
    render(<SearchTransactions onSearch={onSearch} />)

    fireEvent.change(searchbox(), { target: { value: 'treas' } })
    advance(299)
    expect(onSearch).not.toHaveBeenCalled()
    advance(1)

    expect(onSearch).toHaveBeenCalledWith('treas')
  })

  it('searches once for the text typed before the pause', () => {
    const onSearch = jest.fn()
    render(<SearchTransactions onSearch={onSearch} />)

    fireEvent.change(searchbox(), { target: { value: 'treas' } })
    advance(100)
    fireEvent.change(searchbox(), { target: { value: 'treasury' } })
    advance(300)

    expect(onSearch).toHaveBeenCalledTimes(1)
    expect(onSearch).toHaveBeenCalledWith('treasury')
  })

  it('searches the text without surrounding spaces', () => {
    const onSearch = jest.fn()
    render(<SearchTransactions onSearch={onSearch} />)

    fireEvent.change(searchbox(), { target: { value: ' treasury ' } })
    advance(300)

    expect(onSearch).toHaveBeenCalledWith('treasury')
  })

  it('clears the search at once', () => {
    const onSearch = jest.fn()
    render(<SearchTransactions onSearch={onSearch} />)
    fireEvent.change(searchbox(), { target: { value: 'polygon' } })
    advance(300)

    fireEvent.click(screen.getByRole('button', { name: 'Clear search' }))

    expect(searchbox()).toHaveValue('')
    expect(onSearch).toHaveBeenLastCalledWith('')
  })

  it('drops a pending search when cleared', () => {
    const onSearch = jest.fn()
    render(<SearchTransactions onSearch={onSearch} />)

    fireEvent.change(searchbox(), { target: { value: 'polygon' } })
    fireEvent.click(screen.getByRole('button', { name: 'Clear search' }))
    advance(300)

    expect(onSearch).toHaveBeenCalledTimes(1)
    expect(onSearch).toHaveBeenCalledWith('')
  })

  it('accepts at most 100 characters, the gateway limit', () => {
    render(<SearchTransactions onSearch={jest.fn()} />)

    expect(searchbox()).toHaveAttribute('maxLength', '100')
  })
})
