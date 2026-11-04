import { validateTrialDetails } from './trialDetails'

const valid = { email: 'ops@example.com', name: 'Sam Doe', company: '', acceptsTerms: true }

describe('validateTrialDetails', () => {
  it('accepts a complete form without a company', () => {
    expect(validateTrialDetails(valid)).toEqual({})
  })

  it('asks for a valid email, a name and the terms', () => {
    expect(validateTrialDetails({ email: 'ops@', name: ' ', company: '', acceptsTerms: false })).toEqual({
      email: 'Enter a valid email address',
      name: 'Enter your name',
      acceptsTerms: 'Accept the terms to start your trial',
    })
  })
})
