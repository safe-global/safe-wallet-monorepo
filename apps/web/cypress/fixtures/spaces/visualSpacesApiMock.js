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
      invitedBy: 'system',
      status: 'ACTIVE',
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
      user: { id: 1, status: 'ACTIVE' },
    },
  ],
}
