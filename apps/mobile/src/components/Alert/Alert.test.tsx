import { render, userEvent } from '@/src/tests/test-utils'
import { Alert } from '.'
import { SafeFontIcon } from '../SafeFontIcon/SafeFontIcon'

describe('Alert', () => {
  it('should render a info alert', async () => {
    const container = render(<Alert type="info" message="Info alert" />)

    expect(container.getByText('Info alert')).toBeTruthy()
    expect(container.getByTestId('info-icon')).toBeTruthy()
    expect(container.queryByTestId('alert-end-icon')).not.toBeTruthy()
    expect(container.queryByTestId('alert-start-icon')).not.toBeTruthy()
  })
  it('should render a info alert without icon', () => {
    const container = render(<Alert type="info" displayIcon={false} message="Info alert" />)

    expect(container.getByText('Info alert')).toBeTruthy()
    expect(container.queryByTestId('info-icon')).not.toBeTruthy()
    expect(container.queryByTestId('alert-end-icon')).not.toBeTruthy()
    expect(container.queryByTestId('alert-start-icon')).not.toBeTruthy()
  })

  it('should render a warning alert', () => {
    const container = render(<Alert type="warning" message="Warning alert" />)

    expect(container.getByText('Warning alert')).toBeTruthy()
    expect(container.queryByTestId('warning-icon')).toBeTruthy()
    expect(container.queryByTestId('alert-end-icon')).not.toBeTruthy()
    expect(container.queryByTestId('alert-start-icon')).not.toBeTruthy()
  })

  it('should render a warning alert without icon', () => {
    const container = render(<Alert type="warning" displayIcon={false} message="Warning alert" />)

    expect(container.getByText('Warning alert')).toBeTruthy()
    expect(container.queryByTestId('warning-icon')).not.toBeTruthy()
    expect(container.queryByTestId('alert-end-icon')).not.toBeTruthy()
    expect(container.queryByTestId('alert-start-icon')).not.toBeTruthy()
  })

  it('should render an error alert', () => {
    const container = render(<Alert type="error" message="Error alert" />)

    expect(container.getByText('Error alert')).toBeTruthy()
    expect(container.queryByTestId('error-icon')).toBeTruthy()
    expect(container.queryByTestId('alert-end-icon')).not.toBeTruthy()
    expect(container.queryByTestId('alert-start-icon')).not.toBeTruthy()
  })

  it('should render an error alert without icon', () => {
    const container = render(<Alert type="error" displayIcon={false} message="Error alert" />)

    expect(container.getByText('Error alert')).toBeTruthy()
    expect(container.queryByTestId('error-icon')).not.toBeTruthy()
    expect(container.queryByTestId('alert-end-icon')).not.toBeTruthy()
    expect(container.queryByTestId('alert-start-icon')).not.toBeTruthy()
  })

  it('should be able to click in the alert component if an onPress function is passed', async () => {
    const user = userEvent.setup()
    const mockFn = jest.fn()
    const container = render(
      <Alert type="warning" displayIcon={false} onPress={mockFn} message="Click to see something" />,
    )

    await user.press(container.getByText('Click to see something'))

    expect(mockFn).toHaveBeenCalled()
  })

  it('should render an alert with start icon', () => {
    const container = render(
      <Alert
        type="error"
        startIcon={<SafeFontIcon testID="add-owner-icon" name="add-owner" />}
        message="Error alert"
      />,
    )

    expect(container.queryByTestId('add-owner-icon')).toBeTruthy()
  })

  it('should render an alert with an end icon', () => {
    const container = render(
      <Alert type="error" endIcon={<SafeFontIcon testID="add-owner-icon" name="add-owner" />} message="Error alert" />,
    )

    expect(container.queryByTestId('add-owner-icon')).toBeTruthy()
  })

  it('should render an alert with a name icon', () => {
    const container = render(<Alert type="error" iconName="add-owner" message="Error alert" />)

    expect(container.queryByTestId('add-owner-icon')).toBeTruthy()
  })

  it('should render an alert with a left orientation', () => {
    const container = render(<Alert type="error" orientation="left" message="Error alert" />)

    expect(container.queryByTestId('error-icon')).toBeTruthy()
  })

  it('should render an alert with a right orientation', () => {
    const container = render(<Alert type="error" orientation="right" message="Error alert" />)

    expect(container.queryByTestId('error-icon')).toBeTruthy()
  })

  it('should render an alert with a center orientation', () => {
    const container = render(<Alert type="error" orientation="center" message="Error alert" />)

    expect(container.queryByTestId('error-icon')).toBeTruthy()
  })
})
