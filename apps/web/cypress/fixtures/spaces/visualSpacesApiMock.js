/**
 * CGW-shaped payload for **visual** E2E intercepts only (`e2e/visual/spaces.cy.js`).
 * Not used for staging regression — see `staticSpaces.js` for real space id + name.
 */
export const visualSpacesApiMockSpace = {
  id: 1,
  name: 'Test Space',
  status: 'ACTIVE',
  members: [
    {
      id: 1,
      role: 'ADMIN',
      name: 'Admin User',
      invitedBy: null,
      status: 'ACTIVE',
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
      user: { id: 1, status: 'ACTIVE' },
    },
  ],
}

const INVITER_ADDRESS = '0xabcdef0123456789abcdef0123456789abcdef01'
const INVITER_EMAIL = 'admin@example.com'

/**
 * Current user (id 1) is INVITED to this space, with the inviter identified by an Ethereum address.
 * Triggers `<SpaceListInvite>` -> `<Inviter>` -> `<EthHashInfo>` branch.
 */
export const visualSpacesApiMockInviteFromAddress = {
  id: 2,
  name: 'Invite From Address Space',
  status: 'ACTIVE',
  safeCount: 0,
  members: [
    {
      id: 10,
      role: 'MEMBER',
      name: 'Pending User',
      invitedBy: 99,
      invitedByName: INVITER_ADDRESS,
      status: 'INVITED',
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
      user: { id: 1, status: 'PENDING' },
    },
  ],
}

/**
 * Current user (id 1) is INVITED to this space, with the inviter identified by an email.
 * Triggers `<SpaceListInvite>` -> `<Inviter>` -> `<EmailInfo>` branch.
 */
export const visualSpacesApiMockInviteFromEmail = {
  id: 3,
  name: 'Invite From Email Space',
  status: 'ACTIVE',
  safeCount: 0,
  members: [
    {
      id: 11,
      role: 'MEMBER',
      name: 'Pending User',
      invitedBy: 99,
      invitedByName: INVITER_EMAIL,
      status: 'INVITED',
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
      user: { id: 1, status: 'PENDING' },
    },
  ],
}
