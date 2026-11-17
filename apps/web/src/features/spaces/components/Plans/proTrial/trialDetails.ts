import { PRO_TRIAL_COPY } from './copy'

export type TrialDetails = { email: string; name: string; company: string; acceptsTerms: boolean }

export type TrialDetailsErrors = Partial<Record<'email' | 'name' | 'acceptsTerms', string>>

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** The billing email is the one address every trial has, so it stays required; the company is optional. */
export const validateTrialDetails = (details: TrialDetails): TrialDetailsErrors => {
  const errors: TrialDetailsErrors = {}
  if (!EMAIL.test(details.email.trim())) errors.email = PRO_TRIAL_COPY.trialDetails.emailError
  if (!details.name.trim()) errors.name = PRO_TRIAL_COPY.trialDetails.nameError
  if (!details.acceptsTerms) errors.acceptsTerms = PRO_TRIAL_COPY.trialDetails.termsError
  return errors
}
