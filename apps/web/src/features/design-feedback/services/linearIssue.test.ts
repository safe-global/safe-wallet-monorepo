import { buildFeedbackUrl, type FeedbackTarget } from './linearIssue'

const TARGET: FeedbackTarget = {
  workspace: 'safe-global',
  ticket: 'DES-143',
  team: 'DES',
  project: 'DES / Private notes & pending queue',
}

const pinLink = 'https://preview.test/prototypes/pending-queue?scenario=realistic&pin=40%3A50%40%23proposal-signers'

describe('buildFeedbackUrl', () => {
  const url = new URL(
    buildFeedbackUrl({
      ...TARGET,
      comment: 'The signer list should show who is next\nand why',
      where: 'Review drawer footer › "Signers" button',
      transaction: 'Send to Globex Payroll · Treasury Main #42',
      pinLink,
      viewport: '1440×900',
      theme: 'dark',
    }),
  )
  const description = url.searchParams.get('description') ?? ''

  it('opens a new DES issue in the prototype project', () => {
    expect(url.origin + url.pathname).toBe('https://linear.app/team/DES/new')
    expect(url.searchParams.get('project')).toBe('DES / Private notes & pending queue')
  })

  it('titles the issue with the ticket and the first line of the comment', () => {
    expect(url.searchParams.get('title')).toBe('[Feedback] DES-143: The signer list should show who is next')
  })

  it('puts the comment first, then where it was pinned', () => {
    expect(description.startsWith('The signer list should show who is next\nand why')).toBe(true)
    expect(description).toContain('**Where:** Review drawer footer › "Signers" button')
    expect(description).toContain('**Transaction:** Send to Globex Payroll · Treasury Main #42')
    expect(description).toContain(`**Pin link:** [Open pinned spot](${pinLink})`)
    expect(description).toContain('**Viewport:** 1440×900 · **Theme:** dark')
  })

  it('attaches the pin link', () => {
    expect(url.searchParams.get('links')).toBe(`${pinLink}|Open pinned spot`)
  })
})
