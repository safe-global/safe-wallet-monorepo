import { GATEWAY_URL } from '@/config/gateway'
import { GATEWAY_URL_STAGING } from '@/config/gatewayUrls'

describe('test MSW server', () => {
  it('mocks the gateway URL that the app calls in tests', () => {
    expect(GATEWAY_URL).toBe(GATEWAY_URL_STAGING)
  })
})
