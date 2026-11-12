import { isAddress } from 'ethers'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { maybePlural } from '@safe-global/utils/utils/formatters'
import { NAME_MIN_LENGTH, sanitizeName, validateName } from '@safe-global/utils/validation/names'
import type { TrialSize } from '@safe-global/views/features/spaces/components/Plans/types'
import { SPACE_NAME_MAX_LENGTH } from '@/features/spaces/constants'
import type { WorkspaceDraft } from '@/features/spaces/store'
import { countSeats } from '@/utils/spaces'
import { isDomain } from '@/services/ens'
import { INVALID_IDENTIFIER_ERROR, isEmailAddress } from '../AddMemberModal/utils'
import type { WizardStep, WizardStepId } from './steps'

/** Mirrors the CGW's SPACES_MAX_INVITES default. */
export const MAX_INVITES = 50

export type ValidationContext = {
  /** The trial sizes on offer; undefined while they load. */
  sizes?: TrialSize[]
  /** The signed-in user's own wallets, who cannot invite themselves. */
  ownAddresses?: string[]
}

type StepValidator = (draft: WorkspaceDraft, context: ValidationContext) => string | null

export const getPickedSize = (draft: WorkspaceDraft, context: ValidationContext): TrialSize | undefined =>
  context.sizes?.find((size) => size.paymentLinkId === draft.paymentLinkId)

const validateNameStep: StepValidator = (draft) => {
  const name = sanitizeName(draft.name)
  if (name === '') return 'Required'
  return validateName(name, { minLength: NAME_MIN_LENGTH, maxLength: SPACE_NAME_MAX_LENGTH }) ?? null
}

const validatePlanStep: StepValidator = (draft, context) => {
  if (!draft.paymentLinkId) return 'Pick a plan'
  if (context.sizes && !getPickedSize(draft, context)) return 'This plan is no longer offered. Pick another plan.'
  return null
}

const validateSafesStep: StepValidator = (draft, context) => {
  const seats = getPickedSize(draft, context)?.seats
  const used = countSeats(draft.safes.map((safe) => safe.address))
  if (seats === undefined || used <= seats) return null
  const excess = used - seats
  return `Remove ${excess} Safe account${maybePlural(excess)} or pick a larger plan`
}

const validateInviteStep: StepValidator = (draft, context) => {
  const identifiers = draft.invites.map((invite) => invite.identifier.trim()).filter(Boolean)
  if (identifiers.length > MAX_INVITES) return `You can invite up to ${MAX_INVITES} members at once`
  const unresolved = identifiers.filter((id) => !isEmailAddress(id) && !isAddress(id))
  if (unresolved.some((id) => !isDomain(id))) return INVALID_IDENTIFIER_ERROR
  if (unresolved.length > 0) return 'Wait until every ENS name resolves'
  const lowered = identifiers.map((id) => id.toLowerCase())
  if (new Set(lowered).size !== lowered.length) return 'Each member can be invited once'
  const ownAddresses = context.ownAddresses ?? []
  if (identifiers.some((id) => ownAddresses.some((own) => sameAddress(own, id))))
    return 'You are already in this Workspace'
  return null
}

const validateSurveyStep: StepValidator = (draft) =>
  Object.values(draft.surveySelections).some((keys) => keys.length > 0) ? null : 'Select at least one option'

const STEP_VALIDATORS: Record<WizardStepId, StepValidator> = {
  name: validateNameStep,
  plan: validatePlanStep,
  safes: validateSafesStep,
  invite: validateInviteStep,
  survey: validateSurveyStep,
}

export const validateStep = (id: WizardStepId, draft: WorkspaceDraft, context: ValidationContext): string | null =>
  STEP_VALIDATORS[id](draft, context)

/** The first step whose data is missing or no longer valid, so a deep link or a resumed draft can open it. */
export const findFirstInvalidStep = (
  steps: WizardStep[],
  draft: WorkspaceDraft,
  context: ValidationContext,
): WizardStep | undefined => steps.find((step) => validateStep(step.id, draft, context) !== null)
