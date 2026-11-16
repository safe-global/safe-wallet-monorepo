/**
 * @jest-environment node
 */
import { getRedirectUri } from '../../public/oauth'

describe('getRedirectUri on the server', () => {
  it('should return the callback route', () => {
    expect(getRedirectUri()).toBe('/hypernative/oauth-callback')
  })
})
