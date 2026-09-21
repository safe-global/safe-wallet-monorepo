import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { trackEvent } from '@/services/analytics'
import Track from '.'

jest.mock('@/services/analytics', () => ({
  trackEvent: jest.fn(),
}))

const mockTrackEvent = trackEvent as jest.MockedFunction<typeof trackEvent>

const trackData = { category: 'nested-safes', action: 'Open nested Safe' }

const getWrapper = (container: HTMLElement): HTMLElement => {
  const wrapper = container.querySelector<HTMLElement>('[data-track]')
  if (!wrapper) throw new Error('Track wrapper not found')
  return wrapper
}

describe('Track', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('tracks a click on an enabled child', async () => {
    render(
      <Track {...trackData}>
        <button>Go to Nested Safe</button>
      </Track>,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Go to Nested Safe' }))

    expect(mockTrackEvent).toHaveBeenCalledTimes(1)
    expect(mockTrackEvent).toHaveBeenCalledWith(trackData, undefined)
  })

  it('does not track a click when a child carries the disabled attribute', async () => {
    const { container } = render(
      <Track {...trackData}>
        <button disabled>Go to Nested Safe</button>
      </Track>,
    )

    // a disabled child is pointer-events-none, so the click lands on the wrapper
    await userEvent.click(getWrapper(container))

    expect(mockTrackEvent).not.toHaveBeenCalled()
  })

  it('does not track a click when a child is aria-disabled', async () => {
    const { container } = render(
      <Track {...trackData}>
        <a href="/nested-safe" aria-disabled="true">
          Go to Nested Safe
        </a>
      </Track>,
    )

    await userEvent.click(getWrapper(container))

    expect(mockTrackEvent).not.toHaveBeenCalled()
  })

  it('tracks a click when a child is explicitly not aria-disabled', async () => {
    render(
      <Track {...trackData}>
        <a href="/nested-safe" aria-disabled="false">
          Go to Nested Safe
        </a>
      </Track>,
    )

    await userEvent.click(screen.getByRole('link', { name: 'Go to Nested Safe' }))

    expect(mockTrackEvent).toHaveBeenCalledTimes(1)
  })
})
