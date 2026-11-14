import { faker } from '@faker-js/faker'
import {
  _CHECKOUT_SESSION_ID_PLACEHOLDER,
  getCheckoutReturnUrl,
  getPortalReturnUrl,
  getWizardReturnUrl,
} from '../returnUrl'

const STAGING_GATEWAY_URL = 'https://safe-client.staging.5afe.dev'
const SPACE_ID = faker.string.uuid()

let mockGatewayUrl = STAGING_GATEWAY_URL
jest.mock('@/config/gateway', () => ({
  get GATEWAY_URL() {
    return mockGatewayUrl
  },
}))

describe('returnUrl', () => {
  afterEach(() => {
    mockGatewayUrl = STAGING_GATEWAY_URL
  })

  it('points a localhost origin at the staging web app and keeps the session placeholder un-encoded', () => {
    expect(window.location.origin).toMatch(/^http:\/\/localhost/)

    expect(getCheckoutReturnUrl(SPACE_ID)).toBe(
      `https://safe-wallet-web.dev.5afe.dev/spaces?spaceId=${SPACE_ID}&sessionId=${_CHECKOUT_SESSION_ID_PLACEHOLDER}`,
    )
  })

  it('lets a flow pick where the checkout returns to', () => {
    expect(getCheckoutReturnUrl(SPACE_ID, '/welcome/create-space')).toBe(
      `https://safe-wallet-web.dev.5afe.dev/welcome/create-space?spaceId=${SPACE_ID}&sessionId=${_CHECKOUT_SESSION_ID_PLACEHOLDER}`,
    )
  })

  it('returns the onboarding of a new Workspace to its last step without a Workspace ID', () => {
    expect(getWizardReturnUrl('/welcome/survey', null)).toBe(
      `https://safe-wallet-web.dev.5afe.dev/welcome/survey?sessionId=${_CHECKOUT_SESSION_ID_PLACEHOLDER}`,
    )
  })

  it('returns the onboarding of an existing Workspace to its last step with its ID', () => {
    expect(getWizardReturnUrl('/welcome/survey', SPACE_ID)).toBe(
      `https://safe-wallet-web.dev.5afe.dev/welcome/survey?spaceId=${SPACE_ID}&sessionId=${_CHECKOUT_SESSION_ID_PLACEHOLDER}`,
    )
  })

  it('comes back to localhost when the gateway runs on loopback too, as on the isolated stack', () => {
    mockGatewayUrl = 'http://localhost:8000/cgw'

    expect(getCheckoutReturnUrl(SPACE_ID)).toBe(
      `${window.location.origin}/spaces?spaceId=${SPACE_ID}&sessionId=${_CHECKOUT_SESSION_ID_PLACEHOLDER}`,
    )
  })

  it('returns the portal to the Plans page of the same Workspace', () => {
    expect(getPortalReturnUrl(SPACE_ID)).toBe(`https://safe-wallet-web.dev.5afe.dev/spaces/plans?spaceId=${SPACE_ID}`)
  })
})
