import { render, screen, fireEvent } from '@/tests/test-utils'
import { buildFeedbackUrl, FeedbackButton } from './FeedbackButton'

const target = { ticket: 'DES-143', team: 'DES', project: 'DES / Private notes & pending queue' }

describe('buildFeedbackUrl', () => {
  it('prefills a Linear issue with the ticket, page and viewport', () => {
    const url = new URL(
      buildFeedbackUrl({
        ...target,
        pageUrl: 'https://preview.test/prototypes/pending-queue?scenario=conflict-heavy&groupBy=safe',
        viewport: '1440×900',
        context: 'Send to Atlas Labs (grants-9)',
      }),
    )

    expect(url.origin + url.pathname).toBe('https://linear.app/team/DES/new')
    expect(url.searchParams.get('title')).toBe('[Feedback] DES-143: ')
    expect(url.searchParams.get('project')).toBe(target.project)
    expect(url.searchParams.get('description')).toContain(
      '**Page:** https://preview.test/prototypes/pending-queue?scenario=conflict-heavy&groupBy=safe',
    )
    expect(url.searchParams.get('description')).toContain('**Viewport:** 1440×900')
    expect(url.searchParams.get('description')).toContain('**Open in drawer:** Send to Atlas Labs (grants-9)')
    expect(url.searchParams.get('links')).toBe(
      'https://preview.test/prototypes/pending-queue?scenario=conflict-heavy&groupBy=safe|Prototype preview',
    )
  })

  it('leaves out the drawer line when nothing is open', () => {
    const url = new URL(buildFeedbackUrl({ ...target, pageUrl: 'https://preview.test/', viewport: '375×812' }))

    expect(url.searchParams.get('description')).not.toContain('Open in drawer')
  })
})

describe('FeedbackButton', () => {
  it('opens the prefilled issue in a new tab without an opener', () => {
    const open = jest.spyOn(window, 'open').mockReturnValue(null)
    render(<FeedbackButton {...target} context="Batch / 46 actions" />)

    fireEvent.click(screen.getByRole('button', { name: 'Leave feedback in Linear' }))

    expect(open).toHaveBeenCalledWith(
      expect.stringContaining('https://linear.app/team/DES/new?'),
      '_blank',
      'noopener,noreferrer',
    )
    const url = new URL(open.mock.calls[0][0] as string)
    expect(url.searchParams.get('description')).toContain('**Open in drawer:** Batch / 46 actions')
    open.mockRestore()
  })
})
