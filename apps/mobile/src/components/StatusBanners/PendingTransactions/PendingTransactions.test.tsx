import { render, userEvent } from '@/src/tests/test-utils'
import { PendingTransactions } from '.'

describe('PendingTransactions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render the default markup', async () => {
    const user = userEvent.setup()
    const mockedFn = jest.fn()

    const { getByText } = render(<PendingTransactions number={'2'} onPress={mockedFn} />)

    expect(getByText('2')).toBeTruthy()

    await user.press(getByText('Pending transactions'))

    expect(mockedFn).toHaveBeenCalled()
  })

  it('should render the pending transactions in fullWidth layout', () => {
    const container = render(<PendingTransactions number={'2'} fullWidth onPress={jest.fn()} />)

    expect(container).toMatchSnapshot()
  })
})
