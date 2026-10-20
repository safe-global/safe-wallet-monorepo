import { parsePersona } from './personas'

describe('parsePersona', () => {
  it('opens old observer links as the member persona', () => {
    expect(parsePersona('observer')).toBe('member')
  })

  it('falls back to the signer for unknown values', () => {
    expect(parsePersona('nope')).toBe('owner')
    expect(parsePersona(undefined)).toBe('owner')
  })
})
