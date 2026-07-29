import { render, screen } from '@/tests/test-utils'
import userEvent from '@testing-library/user-event'
import Slider from './Slider'

describe('Slider', () => {
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
