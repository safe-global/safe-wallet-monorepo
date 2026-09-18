import { CHECKOUT_SESSION_ID_PLACEHOLDER, getCheckoutReturnUrl, getPortalReturnUrl } from '../returnUrl'

const SPACE_ID = '11111111-1111-1111-1111-111111111111'

describe('returnUrl', () => {
  it('points a localhost origin at the staging web app and keeps the session placeholder un-encoded', () => {
    expect(window.location.origin).toMatch(/^http:\/\/localhost/)

    expect(getCheckoutReturnUrl(SPACE_ID)).toBe(
      `https://safe-wallet-web.dev.5afe.dev/spaces?spaceId=${SPACE_ID}&sessionId=${CHECKOUT_SESSION_ID_PLACEHOLDER}`,
    )
  })

  it('lets a flow pick where the checkout returns to', () => {
    expect(getCheckoutReturnUrl(SPACE_ID, '/welcome/create-space')).toBe(
      `https://safe-wallet-web.dev.5afe.dev/welcome/create-space?spaceId=${SPACE_ID}&sessionId=${CHECKOUT_SESSION_ID_PLACEHOLDER}`,
    )
  })

  it('returns the portal to the Plans page of the same Workspace', () => {
    expect(getPortalReturnUrl(SPACE_ID)).toBe(`https://safe-wallet-web.dev.5afe.dev/spaces/plans?spaceId=${SPACE_ID}`)
  })
})
