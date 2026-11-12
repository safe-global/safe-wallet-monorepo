import { faker } from '@faker-js/faker'
import type { TrialSize } from '@safe-global/views/features/spaces/components/Plans/types'
import { DISALLOWED_CHARACTER_MESSAGE } from '@safe-global/utils/validation/names'
import type { DraftInvite, DraftSafe } from '@/features/spaces/store'
import { fakerChecksummedAddress } from '@/tests/test-utils'
import { fakeWorkspaceName, workspaceDraftBuilder } from '@/tests/builders/workspaceDraft'
import { MemberRole } from '../../../memberRole'
import { INVALID_IDENTIFIER_ERROR } from '../../AddMemberModal/utils'
import { getEnabledSteps } from '../steps'
import { MAX_INVITES, findFirstInvalidStep, validateStep } from '../validation'

const trialSize = (seats: number): TrialSize => ({
  paymentLinkId: `plink_${faker.string.alphanumeric(10)}`,
  seats,
  planName: faker.commerce.productName(),
  monthlyPrice: faker.number.int({ min: 10, max: 2_000 }),
  currency: 'eur',
})

const invite = (identifier: string): DraftInvite => ({ identifier, role: MemberRole.MEMBER })

const safeOn = (chainId: string, address = fakerChecksummedAddress()): DraftSafe => ({ chainId, address })

describe('validateStep', () => {
  describe('name', () => {
    it.each([
      ['blank', '   ', 'Required'],
      ['too short', 'ab', 'Names must be at least 3 character(s) long'],
      ['too long', 'a'.repeat(31), 'Names must be at most 30 characters long'],
      ['with a disallowed character', 'Ops!', DISALLOWED_CHARACTER_MESSAGE],
    ])('rejects a name that is %s', (_, name, error) => {
      const draft = workspaceDraftBuilder().with({ name }).build()

      expect(validateStep('name', draft, {})).toBe(error)
    })

    it('accepts a name within the rules', () => {
      const draft = workspaceDraftBuilder().with({ name: fakeWorkspaceName() }).build()

      expect(validateStep('name', draft, {})).toBeNull()
    })
  })

  describe('plan', () => {
    const sizes = [trialSize(2), trialSize(5)]

    it('asks for a plan when none is picked', () => {
      expect(validateStep('plan', workspaceDraftBuilder().build(), { sizes })).toBe('Pick a plan')
    })

    it('rejects a plan that is no longer on offer', () => {
      const draft = workspaceDraftBuilder().with({ paymentLinkId: 'plink_withdrawn' }).build()

      expect(validateStep('plan', draft, { sizes })).toBe('This plan is no longer offered. Pick another plan.')
    })

    it('accepts any picked plan while the offer is loading', () => {
      const draft = workspaceDraftBuilder().with({ paymentLinkId: 'plink_withdrawn' }).build()

      expect(validateStep('plan', draft, {})).toBeNull()
    })

    it('accepts a plan that is on offer', () => {
      const draft = workspaceDraftBuilder().with({ paymentLinkId: sizes[1].paymentLinkId }).build()

      expect(validateStep('plan', draft, { sizes })).toBeNull()
    })
  })

  describe('safes', () => {
    const multichain = fakerChecksummedAddress()
    const threeAddressesOnFourChains = [safeOn('1', multichain), safeOn('137', multichain), safeOn('1'), safeOn('1')]

    it('counts one seat per Safe address however many chains it is on', () => {
      const size = trialSize(3)
      const draft = workspaceDraftBuilder()
        .with({ safes: threeAddressesOnFourChains, paymentLinkId: size.paymentLinkId })
        .build()

      expect(validateStep('safes', draft, { sizes: [size] })).toBeNull()
    })

    it('asks to remove the Safes above the seats of the picked plan', () => {
      const size = trialSize(2)
      const draft = workspaceDraftBuilder()
        .with({ safes: threeAddressesOnFourChains, paymentLinkId: size.paymentLinkId })
        .build()

      expect(validateStep('safes', draft, { sizes: [size] })).toBe('Remove 1 Safe account or pick a larger plan')
    })

    it('sets no limit while no plan is picked', () => {
      const draft = workspaceDraftBuilder().with({ safes: threeAddressesOnFourChains }).build()

      expect(validateStep('safes', draft, { sizes: [trialSize(1)] })).toBeNull()
    })
  })

  describe('invite', () => {
    const own = fakerChecksummedAddress()

    it('accepts invites by email and by wallet address', () => {
      const invites = [invite(faker.internet.email()), invite(fakerChecksummedAddress())]
      const draft = workspaceDraftBuilder().with({ invites }).build()

      expect(validateStep('invite', draft, { ownAddresses: [own] })).toBeNull()
    })

    it.each([
      [
        'an identifier that is no email, address or ENS name',
        () => [invite('not an invitee')],
        INVALID_IDENTIFIER_ERROR,
      ],
      ['an ENS name that has not resolved', () => [invite('alice.eth')], 'Wait until every ENS name resolves'],
      [
        'the same email twice in another case',
        () => [invite('jane@example.com'), invite('JANE@example.com')],
        'Each member can be invited once',
      ],
      ['the user’s own wallet', () => [invite(own.toLowerCase())], 'You are already in this Workspace'],
      [
        'more members than the gateway accepts',
        () => Array.from({ length: MAX_INVITES + 1 }, () => invite(fakerChecksummedAddress())),
        `You can invite up to ${MAX_INVITES} members at once`,
      ],
    ])('rejects %s', (_, invites, error) => {
      const draft = workspaceDraftBuilder().with({ invites: invites() }).build()

      expect(validateStep('invite', draft, { ownAddresses: [own] })).toBe(error)
    })
  })

  describe('survey', () => {
    const pageId = faker.string.alphanumeric(8)

    it('needs at least one answer', () => {
      const draft = workspaceDraftBuilder()
        .with({ surveySelections: { [pageId]: [] } })
        .build()

      expect(validateStep('survey', draft, {})).toBe('Select at least one option')
    })

    it('accepts one answer', () => {
      const draft = workspaceDraftBuilder()
        .with({ surveySelections: { [pageId]: [faker.string.alpha(8)] } })
        .build()

      expect(validateStep('survey', draft, {})).toBeNull()
    })
  })
})

describe('findFirstInvalidStep', () => {
  const steps = getEnabledSteps({ isSafePro: true, isSurveyEnabled: true })
  const size = trialSize(5)

  it('finds the first step that misses data', () => {
    const draft = workspaceDraftBuilder().with({ name: fakeWorkspaceName() }).build()

    expect(findFirstInvalidStep(steps, draft, { sizes: [size] })?.id).toBe('plan')
  })

  it('finds nothing when every step is complete', () => {
    const draft = workspaceDraftBuilder()
      .with({
        name: fakeWorkspaceName(),
        paymentLinkId: size.paymentLinkId,
        surveySelections: { [faker.string.alphanumeric(8)]: [faker.string.alpha(8)] },
      })
      .build()

    expect(findFirstInvalidStep(steps, draft, { sizes: [size] })).toBeUndefined()
  })
})

describe('getEnabledSteps', () => {
  it.each([
    [true, true, ['name', 'plan', 'safes', 'invite', 'survey']],
    [true, false, ['name', 'plan', 'safes', 'invite']],
    [false, true, ['name', 'safes', 'invite', 'survey']],
    [false, false, ['name', 'safes', 'invite']],
  ])('with Safe Pro %s and the survey %s, runs %j', (isSafePro, isSurveyEnabled, ids) => {
    expect(getEnabledSteps({ isSafePro, isSurveyEnabled }).map((step) => step.id)).toEqual(ids)
  })
})
