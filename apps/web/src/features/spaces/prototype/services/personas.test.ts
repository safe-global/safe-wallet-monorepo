import { parsePersona, PERSONAS } from './personas'

describe('parsePersona', () => {
  it('opens old observer links as the member persona', () => {
    expect(parsePersona('observer')).toBe('member')
  })

  it('falls back to the signer for unknown values', () => {
    expect(parsePersona('nope')).toBe('owner')
    expect(parsePersona(undefined)).toBe('owner')
  })
})

describe('PERSONAS', () => {
  it('frames every persona as a job statement', () => {
    Object.values(PERSONAS).forEach(({ jtbd }) => expect(jtbd).toMatch(/^When .+, I want to .+, so .+\.$/))
  })

  it('marks the daily operator and the buyer as primary', () => {
    const primary = Object.values(PERSONAS).filter(({ priority }) => priority === 'primary')
    expect(primary.map(({ name }) => name)).toEqual(['Dev', 'Noor'])
  })
})
