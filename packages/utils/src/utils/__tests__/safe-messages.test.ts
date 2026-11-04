import { isSafeSignerMessageSupported } from '../safe-messages'

describe('isSafeSignerMessageSupported', () => {
  it.each(['1.5.0', '1.5.0+L2', '1.6.0'])('accepts a Safe signer on a Safe %s', (version) => {
    expect(isSafeSignerMessageSupported(version)).toBe(true)
  })

  it.each(['1.4.1', '1.4.1+L2', '1.3.0', '1.0.0'])('rejects a Safe signer on a Safe %s', (version) => {
    expect(isSafeSignerMessageSupported(version)).toBe(false)
  })

  it.each([null, undefined, ''])('does not block a Safe of unknown version (%p)', (version) => {
    expect(isSafeSignerMessageSupported(version)).toBe(true)
  })
})
