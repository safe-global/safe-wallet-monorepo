import { useState } from 'react'
import { act, fireEvent, render, screen, waitFor } from '@/tests/test-utils'
import type { FeedbackTarget } from '../services/linearIssue'
import { PinCommentLayer } from './PinCommentLayer'

const TARGET: FeedbackTarget = {
  workspace: 'safe-global',
  ticket: 'DES-143',
  team: 'DES',
  project: 'DES / Private notes & pending queue',
}

const mockStorage: Record<string, unknown> = {}
// The real hook caches per key across renders, so give each test its own store.
jest.mock('@/services/local-storage/useLocalStorage', () => {
  const { useState } = jest.requireActual('react')
  const useMockLocalStorage = (key: string) => useState(mockStorage[key])
  return { __esModule: true, default: useMockLocalStorage }
})

function Harness({ onRowClick = jest.fn(), startActive = true }: { onRowClick?: () => void; startActive?: boolean }) {
  const [active, setActive] = useState(startActive)
  return (
    <>
      <section data-prototype-element="Table">
        <button aria-label="Open Send to Tailspin Labs" onClick={onRowClick}>
          Send
        </button>
      </section>
      <p>Commenting: {String(active)}</p>
      <PinCommentLayer
        active={active}
        onEnter={() => setActive(true)}
        onExit={() => setActive(false)}
        target={TARGET}
      />
    </>
  )
}

const row = () => screen.getByRole('button', { name: 'Open Send to Tailspin Labs' })
const commentBox = () => screen.getByRole('textbox', { name: 'Comment' })
const writeComment = (text: string) => {
  fireEvent.click(row(), { clientX: 20, clientY: 10 })
  fireEvent.change(commentBox(), { target: { value: text } })
  fireEvent.keyDown(commentBox(), { key: 'Enter' })
}
const linearReplies = (...replies: unknown[]) => {
  const fetchMock = jest.fn()
  replies.forEach((data) => fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ data }) }))
  global.fetch = fetchMock
  return fetchMock
}
const PARENT = { issue: { id: 'parent-uuid', team: { id: 'team-uuid' }, project: { id: 'project-uuid' } } }
const CREATED = {
  issueCreate: { success: true, issue: { id: 'new-uuid', identifier: 'DES-201', url: 'https://linear.app/x' } },
}

describe('PinCommentLayer', () => {
  beforeEach(() => {
    Object.keys(mockStorage).forEach((key) => delete mockStorage[key])
    window.history.replaceState(null, '', '/prototypes/pending-queue?scenario=realistic')
    document.elementsFromPoint = jest.fn(() => [row()])
  })
  afterEach(() => jest.restoreAllMocks())

  it('opens the pre-filled Linear form on Enter when no key is connected', () => {
    const open = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined)
    const onRowClick = jest.fn()
    render(<Harness onRowClick={onRowClick} />)

    writeComment('Show the recipient')
    expect(onRowClick).not.toHaveBeenCalled()

    const url = new URL((open.mock.contexts[0] as HTMLAnchorElement).href)
    expect(url.searchParams.get('title')).toBe('[Feedback] DES-143: Show the recipient')
    expect(url.searchParams.get('description')).toContain('**Where:** Table › "Open Send to Tailspin Labs" button')
    expect(screen.getByText('Commenting: true')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Comment 1' })).toBeInTheDocument()
  })

  it('creates the sub-issue in Linear and stays on the page when a key is connected', async () => {
    mockStorage.linearApiKey = 'lin_api_test'
    const fetchMock = linearReplies(PARENT, CREATED, { attachmentCreate: { success: true } })
    const open = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined)
    render(<Harness />)

    writeComment('Show the recipient')

    expect(await screen.findByText('Created DES-201 under DES-143')).toBeInTheDocument()
    expect(open).not.toHaveBeenCalled()
    expect(fetchMock.mock.calls[1][1].headers.Authorization).toBe('lin_api_test')
    expect(JSON.parse(fetchMock.mock.calls[1][1].body).variables.input).toMatchObject({
      teamId: 'team-uuid',
      parentId: 'parent-uuid',
      projectId: 'project-uuid',
      title: '[Feedback] DES-143: Show the recipient',
    })
    const attachment = JSON.parse(fetchMock.mock.calls[2][1].body)
    expect(new URL(attachment.variables.input.url).searchParams.get('issue')).toBe('DES-201')

    fireEvent.click(screen.getByRole('button', { name: 'Comment 201' }))
    expect(screen.getByRole('link', { name: /Open in Linear/ })).toHaveAttribute(
      'href',
      'https://linear.app/safe-global/issue/DES-201',
    )
  })

  it('keeps the comment and offers the form when Linear rejects the key', async () => {
    mockStorage.linearApiKey = 'lin_api_bad'
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ errors: [{ message: 'Authentication required' }] }),
    })
    render(<Harness />)
    writeComment('Show the recipient')

    expect(await screen.findByRole('alert')).toHaveTextContent('Authentication required')
    expect(commentBox()).toHaveValue('Show the recipient')
  })

  it('resolves a comment and closes its Linear issue', async () => {
    mockStorage.linearApiKey = 'lin_api_test'
    linearReplies(PARENT, CREATED, { attachmentCreate: { success: true } })
    render(<Harness />)
    writeComment('Show the recipient')
    await screen.findByText('Created DES-201 under DES-143')

    const fetchMock = linearReplies(
      { issue: { id: 'new-uuid', team: { states: { nodes: [{ id: 'done-uuid' }] } } } },
      { issueUpdate: { success: true } },
    )
    fireEvent.click(screen.getByRole('button', { name: 'Comment 201' }))
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Resolve' }))
    })

    await waitFor(() => expect(screen.getByText('Resolved DES-201 in Linear')).toBeInTheDocument())
    expect(JSON.parse(fetchMock.mock.calls[1][1].body).variables.input).toEqual({ stateId: 'done-uuid' })
    expect(screen.queryByRole('button', { name: 'Comment 201' })).not.toBeInTheDocument()
  })

  it('hides badges outside comment mode', () => {
    jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined)
    render(<Harness />)
    writeComment('Show the recipient')
    expect(screen.getByRole('button', { name: 'Comment 1' })).toBeInTheDocument()

    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.getByText('Commenting: false')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Comment 1' })).not.toBeInTheDocument()
  })

  it('opens comment mode with the linked comment from a pin link', () => {
    window.history.replaceState(
      null,
      '',
      '/prototypes/pending-queue?scenario=realistic&pin=50%3A50%40section%20%3E%20button&issue=DES-201&c=Show%20the%20recipient',
    )
    render(<Harness startActive={false} />)

    expect(screen.getByText('Commenting: true')).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Comment 201' })).toHaveTextContent('Show the recipient')
  })
})
