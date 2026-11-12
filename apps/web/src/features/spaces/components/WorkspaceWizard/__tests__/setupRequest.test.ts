import { faker } from '@faker-js/faker'
import { fakerChecksummedAddress } from '@/tests/test-utils'
import { fakeWorkspaceName, workspaceDraftBuilder } from '@/tests/builders/workspaceDraft'
import { MemberRole } from '../../../memberRole'
import { fromSetup, toSetupRequest } from '../setupRequest'

const RETURN_URL = 'https://app.safe.global/welcome/survey?sessionId={CHECKOUT_SESSION_ID}'

const paymentLinkId = () => `plink_${faker.string.alphanumeric(10)}`

describe('toSetupRequest', () => {
  it('names each Safe address once, across every chain it was picked on', () => {
    const address = fakerChecksummedAddress()
    const safes = [
      { chainId: '1', address },
      { chainId: '137', address },
    ]
    const draft = workspaceDraftBuilder()
      .with({ safes, safeNames: { [address.toLowerCase()]: 'Payroll' } })
      .build()

    const request = toSetupRequest(draft, RETURN_URL)

    expect(request.addressBookItems).toEqual([{ name: 'Payroll', address, chainIds: ['1', '137'] }])
  })

  it('sanitizes the name of a Safe', () => {
    const address = fakerChecksummedAddress()
    const draft = workspaceDraftBuilder()
      .with({ safes: [{ chainId: '1', address }], safeNames: { [address.toLowerCase()]: '  Payroll\u200b ' } })
      .build()

    const request = toSetupRequest(draft, RETURN_URL)

    expect(request.addressBookItems[0].name).toBe('Payroll')
  })

  it('adds an unnamed Safe without an address book entry', () => {
    const safes = [{ chainId: '1', address: fakerChecksummedAddress() }]
    const draft = workspaceDraftBuilder().with({ safes }).build()

    const request = toSetupRequest(draft, RETURN_URL)

    expect(request).toMatchObject({ safes, addressBookItems: [] })
  })

  it('sends an email invite in lower case, named after the part before the @', () => {
    const draft = workspaceDraftBuilder()
      .with({ invites: [{ identifier: 'Jane.Doe@Example.com', role: MemberRole.ADMIN }] })
      .build()

    const request = toSetupRequest(draft, RETURN_URL)

    expect(request.invites).toEqual([{ type: 'email', email: 'jane.doe@example.com', role: 'ADMIN', name: 'Jane.Doe' }])
  })

  it('sends a wallet invite named after its address', () => {
    const wallet = fakerChecksummedAddress()
    const draft = workspaceDraftBuilder()
      .with({ invites: [{ identifier: wallet, role: MemberRole.MEMBER }] })
      .build()

    const request = toSetupRequest(draft, RETURN_URL)

    expect(request.invites).toEqual([{ type: 'wallet', address: wallet, role: 'MEMBER', name: wallet }])
  })

  it('sends the survey answers sorted', () => {
    const draft = workspaceDraftBuilder()
      .with({ surveySelections: { page1: ['run_payments', 'earn_yield'] } })
      .build()

    const request = toSetupRequest(draft, RETURN_URL)

    expect(request.survey).toEqual({ slug: 'onboarding', selections: { page1: ['earn_yield', 'run_payments'] } })
  })

  it('sends no survey when nothing was answered', () => {
    const draft = workspaceDraftBuilder()
      .with({ surveySelections: { page1: [] } })
      .build()

    expect(toSetupRequest(draft, RETURN_URL).survey).toBeNull()
  })

  it('carries the sanitized name, the plan and the return URL', () => {
    const name = fakeWorkspaceName()
    const plan = paymentLinkId()
    const draft = workspaceDraftBuilder()
      .with({ name: ` ${name} `, paymentLinkId: plan })
      .build()

    const request = toSetupRequest(draft, RETURN_URL)

    expect(request).toMatchObject({ name, paymentLinkId: plan, returnUrl: RETURN_URL })
  })
})

describe('fromSetup', () => {
  it('rebuilds the draft of a Workspace whose checkout was cancelled', () => {
    const safe = fakerChecksummedAddress()
    const wallet = fakerChecksummedAddress()
    const email = faker.internet.email().toLowerCase()
    const spaceId = faker.string.uuid()
    const name = fakeWorkspaceName()
    const plan = paymentLinkId()

    const draft = fromSetup(
      {
        status: 'pending',
        paymentLinkId: plan,
        safes: [{ chainId: '1', address: safe }],
        addressBookItems: [{ name: 'Payroll', address: safe, chainIds: ['1'] }],
        invites: [
          { type: 'email', email, role: 'MEMBER', name: 'jane' },
          { type: 'wallet', address: wallet, role: 'ADMIN', name: wallet },
        ],
        survey: { slug: 'onboarding', selections: { page1: ['earn_yield'] } },
      },
      name,
      spaceId,
    )

    expect(draft).toEqual({
      name,
      paymentLinkId: plan,
      safes: [{ chainId: '1', address: safe }],
      safeNames: { [safe.toLowerCase()]: 'Payroll' },
      invites: [
        { identifier: email, role: MemberRole.MEMBER },
        { identifier: wallet, role: MemberRole.ADMIN },
      ],
      surveySelections: { page1: ['earn_yield'] },
      createdSpaceId: spaceId,
    })
  })
})
