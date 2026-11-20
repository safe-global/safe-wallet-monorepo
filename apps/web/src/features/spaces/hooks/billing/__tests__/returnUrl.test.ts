import { faker } from '@faker-js/faker'
import {
  _CHECKOUT_SESSION_ID_PLACEHOLDER,
  getCheckoutReturnUrl,
  getPortalReturnUrl,
  getWizardReturnUrl,
} from '../returnUrl'

const SPACE_ID = faker.string.uuid()
const PUBLIC_ORIGIN = 'https://safe-wallet-web.dev.5afe.dev'

let mockCheckoutReturnOrigin = ''
jest.mock('@/config/constants', () => ({
  ...jest.requireActual('@/config/constants'),
  get CHECKOUT_RETURN_ORIGIN() {
    return mockCheckoutReturnOrigin
  },
}))

describe('returnUrl', () => {
  afterEach(() => {
    mockCheckoutReturnOrigin = ''
  })

  it('comes back to the app itself and keeps the session placeholder un-encoded', () => {
    expect(getCheckoutReturnUrl(SPACE_ID)).toBe(
      `${window.location.origin}/spaces?spaceId=${SPACE_ID}&sessionId=${_CHECKOUT_SESSION_ID_PLACEHOLDER}`,
    )
  })

  it('comes back to the configured origin when one is set', () => {
    mockCheckoutReturnOrigin = PUBLIC_ORIGIN

    expect(getCheckoutReturnUrl(SPACE_ID)).toBe(
      `${PUBLIC_ORIGIN}/spaces?spaceId=${SPACE_ID}&sessionId=${_CHECKOUT_SESSION_ID_PLACEHOLDER}`,
    )
  })

  it('lets a flow pick where the checkout returns to', () => {
    expect(getCheckoutReturnUrl(SPACE_ID, '/welcome/create-space')).toBe(
      `${window.location.origin}/welcome/create-space?spaceId=${SPACE_ID}&sessionId=${_CHECKOUT_SESSION_ID_PLACEHOLDER}`,
    )
  })

  it('returns the onboarding of a new Workspace to its last step without a Workspace ID', () => {
    expect(getWizardReturnUrl('/welcome/survey', null)).toBe(
      `${window.location.origin}/welcome/survey?sessionId=${_CHECKOUT_SESSION_ID_PLACEHOLDER}`,
    )
  })

  it('returns the onboarding of an existing Workspace to its last step with its ID', () => {
    expect(getWizardReturnUrl('/welcome/survey', SPACE_ID)).toBe(
      `${window.location.origin}/welcome/survey?spaceId=${SPACE_ID}&sessionId=${_CHECKOUT_SESSION_ID_PLACEHOLDER}`,
    )
  })

  it('returns the portal to the Plans page of the same Workspace', () => {
    mockCheckoutReturnOrigin = PUBLIC_ORIGIN

    expect(getPortalReturnUrl(SPACE_ID)).toBe(`${PUBLIC_ORIGIN}/spaces/plans?spaceId=${SPACE_ID}`)
  })
})
