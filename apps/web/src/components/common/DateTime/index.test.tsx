import { render } from '@/tests/test-utils'

import DateTime from '.'
import { formatDateTime, formatTime } from '@safe-global/utils/utils/date'
import { useTxFilter } from '@/utils/tx-history-filter'

jest.mock('@/utils/tx-history-filter', () => ({
  useTxFilter: jest.fn(() => [null, jest.fn()]),
}))

describe('DateTime', () => {
  beforeAll(() => {
    // If we do not use a fixed date, this test will fail once a year (in some timezones) due to daylight saving time.
    jest.useFakeTimers()
    jest.setSystemTime(Date.parse('01.01.2023'))
  })

  afterAll(() => {
    jest.useRealTimers()
  })

  it('should render the relative time before threshold on the queue', () => {
    const date = new Date()
    const days = 3

    date.setDate(date.getDate() - days)

    const { queryByText } = render(<DateTime value={date.getTime()} />, {
      routerProps: { pathname: '/transactions/queue' },
    })

    expect(queryByText('3 days ago')).toBeInTheDocument()
  })

  it('should render the full date and time after threshold on the queue', () => {
    const date = new Date()
    const days = 61

    date.setDate(date.getDate() - days)

    const { queryByText } = render(<DateTime value={date.getTime()} />, {
      routerProps: { pathname: '/transactions/queue' },
    })

    const expected = formatDateTime(date.getTime())

    expect(queryByText(expected)).toBeInTheDocument()
  })

  it('should render the time on the history', () => {
    const date = new Date()
    const days = 1

    date.setDate(date.getDate() - days)

    const { queryByText } = render(<DateTime value={date.getTime()} />, {
      routerProps: { pathname: '/transactions/history' },
    })

    const expected = formatTime(date.getTime())

    expect(queryByText(expected)).toBeInTheDocument()
  })

  it('should render the relative time before threshold on the filter', () => {
    ;(useTxFilter as jest.Mock).mockImplementation(() => [{ type: 'Incoming', filter: {} }])

    const date = new Date()
    const days = 3

    date.setDate(date.getDate() - days)

    const { getByText } = render(<DateTime value={date.getTime()} />, {
      routerProps: { pathname: '/transactions/history' },
    })

    expect(getByText('3 days ago')).toBeInTheDocument()
  })

  it('should render the full date and time after threshold on the filter', () => {
    ;(useTxFilter as jest.Mock).mockImplementation(() => [{ type: 'Incoming', filter: {} }])

    const date = new Date()
    const days = 61

    date.setDate(date.getDate() - days)

    const { queryByText } = render(<DateTime value={date.getTime()} />, {
      routerProps: { pathname: '/transactions/history' },
    })

    const expected = formatDateTime(date.getTime())

    expect(queryByText(expected)).toBeInTheDocument()
  })
})
