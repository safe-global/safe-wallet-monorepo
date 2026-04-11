import type { SecurityScanner } from './types'

export const addressBookScanner: SecurityScanner = {
  id: 'address_book',
  scan: async (ctx) => {
    const { addressBookEntryCount } = ctx
    const now = new Date().toISOString()

    if (addressBookEntryCount === 0) {
      return {
        status: 'issue',
        severity: 'High',
        score: 20,
        evidence: ['No contacts in address book'],
        remediation: 'Maintain an up-to-date address book to verify recipients before sending transactions.',
        lastChecked: now,
      }
    }

    if (addressBookEntryCount < 3) {
      return {
        status: 'partial',
        severity: 'Medium',
        score: 60,
        evidence: [`${addressBookEntryCount} contact(s) in address book`],
        remediation: 'Add frequently used addresses to your address book to reduce address poisoning risk.',
        lastChecked: now,
      }
    }

    return {
      status: 'clear',
      severity: 'Low',
      score: 100,
      evidence: [`${addressBookEntryCount} contacts in address book`],
      remediation: '',
      lastChecked: now,
    }
  },
}
