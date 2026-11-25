import { render, renderWithUserEvent, screen } from '@/tests/test-utils'
import AllowlistConsent from '../AllowlistConsent'

const LABEL = 'I understand that Payments will only be able to do what this allowlist allows.'

describe('AllowlistConsent', () => {
  it('should name the checkbox after its label, when it renders', () => {
    render(<AllowlistConsent label={LABEL} checked={false} showError={false} onCheckedChange={jest.fn()} />)

    expect(screen.getByRole('checkbox', { name: LABEL })).not.toBeChecked()
  })

  it('should report the tick, when the owner ticks the box', async () => {
    const onCheckedChange = jest.fn()
    const { user } = renderWithUserEvent(
      <AllowlistConsent label={LABEL} checked={false} showError={false} onCheckedChange={onCheckedChange} />,
    )

    await user.click(screen.getByRole('checkbox', { name: LABEL }))

    expect(onCheckedChange).toHaveBeenCalledWith(true)
  })

  it('should ask the owner to tick the box, when they continued without ticking it', () => {
    render(<AllowlistConsent label={LABEL} checked={false} showError onCheckedChange={jest.fn()} />)

    expect(screen.getByText('Tick the box to continue.')).toBeInTheDocument()
  })

  it('should hide the request to tick the box, when the box is ticked', () => {
    render(<AllowlistConsent label={LABEL} checked showError onCheckedChange={jest.fn()} />)

    expect(screen.queryByText('Tick the box to continue.')).not.toBeInTheDocument()
  })
})
