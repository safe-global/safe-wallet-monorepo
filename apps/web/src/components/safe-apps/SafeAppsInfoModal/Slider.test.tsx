import { render, screen } from '@/tests/test-utils'
import userEvent from '@testing-library/user-event'
import Slider from './Slider'

describe('Slider', () => {
  it('renders footer buttons without full-width overflow classes', () => {
    render(
      <Slider onSlideChange={jest.fn()}>
        <div>Slide content</div>
      </Slider>,
    )

    const cancelButton = screen.getByRole('button', { name: 'Cancel' })
    const continueButton = screen.getByRole('button', { name: 'Continue' })

    expect(cancelButton).toHaveClass('flex-1')
    expect(continueButton).toHaveClass('flex-1')
    expect(cancelButton).not.toHaveClass('w-full')
    expect(continueButton).not.toHaveClass('w-full')
  })

  it('calls onSlideChange when Continue is clicked', async () => {
    const onSlideChange = jest.fn()
    const user = userEvent.setup()

    render(
      <Slider onSlideChange={onSlideChange}>
        <div>Slide content</div>
      </Slider>,
    )

    await user.click(screen.getByRole('button', { name: 'Continue' }))

    expect(onSlideChange).toHaveBeenCalledWith(1)
  })
})
