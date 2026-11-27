import { render } from '@/tests/test-utils'
import { withoutUpdatesConsent, withUpdatesConsent } from '@/tests/whatsNew'
import WhatsNewUpdatesFrame from './index'

jest.mock('@/config/constants', () => ({
  ...jest.requireActual('@/config/constants'),
  BEAMER_ID: 'product-id',
}))

const UPDATES_FRAME_SELECTOR = 'iframe[src="https://app.getbeamer.com/utilities?app_id=product-id"]'

describe('WhatsNewUpdatesFrame', () => {
  it("should, when the user has not accepted updates cookies, not add Beamer's updates page", () => {
    const { container } = render(<WhatsNewUpdatesFrame />, withoutUpdatesConsent)

    expect(container.querySelector(UPDATES_FRAME_SELECTOR)).toBeNull()
  })

  it("should, when the user has accepted updates cookies, add Beamer's updates page hidden and sandboxed", () => {
    const { container } = render(<WhatsNewUpdatesFrame />, withUpdatesConsent)

    const frame = container.querySelector(UPDATES_FRAME_SELECTOR)
    expect(frame).not.toBeNull()
    expect(frame).toHaveAttribute('sandbox', 'allow-scripts allow-same-origin')
    expect(frame).toHaveAttribute('hidden')
  })

  it("should, when Beamer's updates page has loaded, ask it to start listening for new posts", () => {
    const { container } = render(<WhatsNewUpdatesFrame />, withUpdatesConsent)
    const frame = container.querySelector<HTMLIFrameElement>(UPDATES_FRAME_SELECTOR)
    const postMessage = jest.spyOn(frame?.contentWindow as Window, 'postMessage').mockImplementation(() => {})

    frame?.dispatchEvent(new Event('load'))

    expect(postMessage).toHaveBeenCalledWith('initUpdatesListener', 'https://app.getbeamer.com')
  })
})
