import * as constants from '../../support/constants.js'
import * as main from '../pages/main.page.js'

const SPACE_ID = '1'

const mockUser = {
  id: 1,
  status: 1,
  wallets: [{ id: 1, address: '0x1234567890123456789012345678901234567890' }],
}

const mockSpace = {
  id: 1,
  name: 'Test Space',
  status: 'ACTIVE',
  members: [
    {
      id: 1,
      role: 'ADMIN',
      name: 'Admin User',
      invitedBy: 'system',
      status: 'ACTIVE',
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
      user: { id: 1, status: 'ACTIVE' },
    },
  ],
}

const mockMembers = {
  members: [
    {
      id: 1,
      role: 'ADMIN',
      name: 'Admin User',
      status: 'ACTIVE',
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
      user: { id: 1, status: 'ACTIVE' },
    },
    {
      id: 2,
      role: 'MEMBER',
      name: 'Team Member',
      status: 'ACTIVE',
      createdAt: '2025-01-02T00:00:00.000Z',
      updatedAt: '2025-01-02T00:00:00.000Z',
      user: { id: 2, status: 'ACTIVE' },
    },
    {
      id: 3,
      role: 'MEMBER',
      name: 'Invited User',
      status: 'INVITED',
      invitedBy: 'Admin User',
      createdAt: '2025-01-03T00:00:00.000Z',
      updatedAt: '2025-01-03T00:00:00.000Z',
      user: { id: 3, status: 'PENDING' },
    },
  ],
}

const mockAddressBook = {
  spaceId: SPACE_ID,
  data: [
    {
      name: 'Treasury',
      address: '0xA77DE01e157f9f57C7c4A326eeEbA7d043150Fa4',
      chainIds: ['11155111'],
      createdBy: 'Admin User',
      lastUpdatedBy: 'Admin User',
    },
    {
      name: 'Operations',
      address: '0xB77DE01e157f9f57C7c4A326eeEbA7d043150Fa5',
      chainIds: ['11155111'],
      createdBy: 'Admin User',
      lastUpdatedBy: 'Team Member',
    },
  ],
}

function setupSpacesAuth() {
  // Enable SPACES feature flag via chain config intercept
  cy.intercept('GET', constants.chainConfigEndpoint, (req) => {
    req.continue((res) => {
      if (res.body && res.body.features) {
        if (!res.body.features.includes(constants.chainFeatures.spaces)) {
          res.body.features.push(constants.chainFeatures.spaces)
        }
      }
    })
  })

  // Mock auth state in localStorage (session expires 24h from now)
  const authData = {
    sessionExpiresAt: Date.now() + 24 * 60 * 60 * 1000,
    lastUsedSpace: SPACE_ID,
  }
  main.addToLocalStorage(constants.localStorageKeys.SAFE_v2__auth, authData)

  // Mock spaces API endpoints (order matters: more specific patterns last)
  cy.intercept('GET', constants.usersEndpoint, mockUser).as('getUser')
  cy.intercept('GET', constants.spacesSafesEndpoint, { safes: {} }).as('getSpaceSafes')
  cy.intercept('GET', constants.spacesMembersEndpoint, mockMembers).as('getSpaceMembers')
  cy.intercept('GET', constants.spacesAddressBookEndpoint, mockAddressBook).as('getSpaceAddressBook')
  cy.intercept('GET', constants.spacesGetOneEndpoint, mockSpace).as('getSpace')
  // Only intercept API calls for listing spaces, not page navigation
  cy.intercept('GET', `${constants.stagingCGWUrlv1}/spaces`, [mockSpace]).as('getSpaces')
}

describe('[VISUAL] Spaces page screenshots', { defaultCommandTimeout: 60000, ...constants.VISUAL_VIEWPORT }, () => {
  beforeEach(() => {
    setupSpacesAuth()
  })

  it('[VISUAL] Screenshot spaces dashboard page', () => {
    cy.visit(constants.spaceDashboardUrl + SPACE_ID)
    cy.contains('Getting started', { timeout: 30000 }).should('be.visible')
    main.verifySkeletonsGone()
  })

  it('[VISUAL] Screenshot spaces settings page', () => {
    cy.visit(constants.spaceUrl + SPACE_ID)
    cy.contains('Settings', { timeout: 30000 }).should('be.visible')
    main.verifySkeletonsGone()
  })

  it('[VISUAL] Screenshot spaces members page', () => {
    cy.visit(constants.spaceMembersUrl + SPACE_ID)
    cy.contains('Members', { timeout: 30000 }).should('be.visible')
    main.verifySkeletonsGone()
  })

  it('[VISUAL] Screenshot spaces safe accounts page', () => {
    cy.visit(constants.spaceSafeAccountsUrl + SPACE_ID)
    cy.contains('Safe Accounts', { timeout: 30000 }).should('be.visible')
    main.verifySkeletonsGone()
  })

  it('[VISUAL] Screenshot spaces address book page', () => {
    cy.visit(constants.spaceAddressBookUrl + SPACE_ID)
    cy.contains('Address book', { timeout: 30000 }).should('be.visible')
    main.verifySkeletonsGone()
  })
})
