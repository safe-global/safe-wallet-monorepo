import * as constants from '../../support/constants.js'
import * as main from '../pages/main.page.js'
import * as space from '../pages/spaces.page.js'
import { visualSpacesApiMockSpace } from '../../fixtures/spaces/visualSpacesApiMock.js'

const SPACE_ID = '1'
const csvFixture = 'spaces/import_address_book.csv'
const jsonFixture = 'spaces/import_address_book.json'
const unsupportedFixture = 'spaces/import_address_book_unsupported.txt'
// Partial match keeps the assertion decoupled from the exact wording of the source copy.
const unsupportedFileError = 'Unsupported file type'

// Mocks the auth + spaces endpoints so the address book page renders for an admin
// without a real backend sign-in. Mirrors the setup used by the visual spaces test.
function setupSpacesAuth() {
  main.addToLocalStorage(constants.localStorageKeys.SAFE_v2__auth, {
    sessionExpiresAt: Date.now() + 24 * 60 * 60 * 1000,
    lastUsedSpace: SPACE_ID,
  })

  // Keep the session-expiry guard's /auth/me probe from 403-ing against staging,
  // which would clear the mocked session and bounce us to /welcome/spaces.
  cy.intercept('GET', '**/v1/auth/me', {
    statusCode: 200,
    body: { id: '1', authMethod: 'siwe', signerAddress: '0x1234567890123456789012345678901234567890' },
  }).as('getAuthMe')

  cy.fixture('spaces/user.json').then((mockUser) => {
    cy.intercept('GET', constants.usersEndpoint, mockUser).as('getUser')
  })
  cy.intercept('GET', constants.spacesSafesEndpoint, { safes: {} }).as('getSpaceSafes')
  cy.intercept('GET', constants.spacesGetOneEndpoint, visualSpacesApiMockSpace).as('getSpace')
  cy.intercept('GET', `${constants.stagingCGWUrlv1}/spaces`, [visualSpacesApiMockSpace]).as('getSpaces')
  cy.fixture('spaces/members.json').then((mockMembers) => {
    cy.intercept('GET', constants.spacesMembersEndpoint, mockMembers).as('getSpaceMembers')
  })
  cy.fixture('spaces/address_book.json').then((mockAddressBook) => {
    cy.intercept('GET', constants.spacesAddressBookEndpoint, mockAddressBook).as('getSpaceAddressBook')
  })
}

describe('Spaces address book file import tests', () => {
  beforeEach(() => {
    setupSpacesAuth()
    cy.intercept('PUT', constants.spacesAddressBookEndpoint, { statusCode: 200, body: {} }).as('importAddressBook')
    space.visitSpaceAddressBook(SPACE_ID)
    space.openImportAddressBookDialog()
    space.switchToUploadFileTab()
  })

  it('Verify that a CSV file can be uploaded and imported into the space address book', () => {
    space.uploadAddressBookFile(csvFixture)

    space.verifyUploadSummary(2, 1)

    space.clickImportUploadedFile()

    space.verifyImportRequestItemCount('@importAddressBook', 2)
    space.verifyImportSuccessNotification()
  })

  it('Verify that a JSON file exported from the app can be uploaded and imported', () => {
    space.uploadAddressBookFile(jsonFixture)

    space.verifyUploadSummary(1, 1)

    space.clickImportUploadedFile()

    space.verifyImportRequestItemCount('@importAddressBook', 1)
    space.verifyImportSuccessNotification()
  })

  it('Verify that uploading an unsupported file type shows an error and keeps import disabled', () => {
    space.uploadAddressBookFile(unsupportedFixture)

    space.verifyImportError(unsupportedFileError)
    space.verifyImportSubmitDisabled()
  })
})
