import type { CreateSpaceSetupDto, SpaceSetupDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { sanitizeName } from '@safe-global/utils/validation/names'
import type { WorkspaceDraft, WorkspaceDraftFields } from '@/features/spaces/store'
import { toMemberRole } from '../../memberRole'
import { buildInviteUserPayload } from '../AddMemberModal/utils'
import { toInviteName } from '../InviteMembersOnboarding/hooks/useInviteForm'
import { ONBOARDING_SURVEY_SLUG } from '../SurveyOnboarding/survey'

/** One address book entry per named Safe address, spanning every chain it was picked on. */
const toAddressBookItems = (draft: WorkspaceDraft): CreateSpaceSetupDto['addressBookItems'] => {
  const chainIdsByAddress = new Map<string, { address: string; chainIds: Set<string> }>()
  for (const { chainId, address } of draft.safes) {
    const key = address.toLowerCase()
    const entry = chainIdsByAddress.get(key) ?? { address, chainIds: new Set<string>() }
    entry.chainIds.add(chainId)
    chainIdsByAddress.set(key, entry)
  }

  return Array.from(chainIdsByAddress, ([key, { address, chainIds }]) => ({
    name: sanitizeName(draft.safeNames[key] ?? ''),
    address,
    chainIds: Array.from(chainIds),
  })).filter((item) => item.name !== '')
}

const toSurvey = (draft: WorkspaceDraft): CreateSpaceSetupDto['survey'] => {
  const answered = Object.entries(draft.surveySelections).filter(([, keys]) => keys.length > 0)
  if (answered.length === 0) return null
  // Sorted, so the same answers always store the same array and group together server-side.
  return {
    slug: ONBOARDING_SURVEY_SLUG,
    selections: Object.fromEntries(answered.map(([pageId, keys]) => [pageId, [...keys].sort()])),
  }
}

/** A pending setup from the server as a draft, so a Workspace whose checkout was cancelled can be finished. */
export const fromSetup = (setup: SpaceSetupDto, name: string, spaceId: string): WorkspaceDraftFields => ({
  name,
  paymentLinkId: setup.paymentLinkId,
  safes: setup.safes,
  safeNames: Object.fromEntries(setup.addressBookItems.map((item) => [item.address.toLowerCase(), item.name])),
  invites: setup.invites.map((invite) => ({
    identifier: invite.type === 'email' ? invite.email : invite.address,
    role: toMemberRole(invite.role),
  })),
  surveySelections: setup.survey?.selections ?? {},
  createdSpaceId: spaceId,
})

/** Everything the CGW needs to create the Workspace now and set it up once the trial starts. */
export const toSetupRequest = (draft: WorkspaceDraft, returnUrl: string): CreateSpaceSetupDto => ({
  name: sanitizeName(draft.name),
  paymentLinkId: draft.paymentLinkId,
  safes: draft.safes,
  addressBookItems: toAddressBookItems(draft),
  invites: draft.invites.map((invite) =>
    buildInviteUserPayload({
      name: toInviteName(invite.identifier),
      inviteeIdentifier: invite.identifier,
      role: invite.role,
    }),
  ),
  survey: toSurvey(draft),
  returnUrl,
})
