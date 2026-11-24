import { http, HttpResponse } from 'msw'
import { faker } from '@faker-js/faker'
import { GATEWAY_URL } from '@/config/gateway'
import { AppRoutes } from '@/config/routes'
import { getStoreInstance } from '@/store'
import { server } from '@/tests/server'
import { fakeUserId, workspaceDraftBuilder } from '@/tests/builders/workspaceDraft'
import { act, advanceClock, render, renderWithUserEvent, screen, waitFor } from '@/tests/test-utils'
import { EMPTY_WORKSPACE_DRAFT } from '../../../public/store/workspaceDraftSlice'
import CheckoutReturnScreen from '../CheckoutReturnScreen'

const storedDraft = () => getStoreInstance().getState().workspaceDraft

const SETUP_TIMEOUT_MS = 60_000

const sessionHandler = (status: string) =>
  http.get<{ sessionId: string }>(`${GATEWAY_URL}/v1/billing/sessions/:sessionId`, ({ params }) =>
    HttpResponse.json({ id: params.sessionId, status }),
  )

const setupHandler = (status: 'pending' | 'applied', onRequest: () => void = () => {}) =>
  http.get(`${GATEWAY_URL}/v1/spaces/:id/setup`, () => {
    onRequest()
    return HttpResponse.json({
      status,
      paymentLinkId: null,
      safes: [],
      addressBookItems: [],
      invites: [],
      survey: null,
    })
  })

const sessionId = () => `cs_${faker.string.alphanumeric(24)}`

describe('CheckoutReturnScreen', () => {
  afterEach(() => jest.useRealTimers())

  it('shows the setup in progress while the gateway applies it after a completed checkout', async () => {
    const setupPolled = jest.fn()
    server.use(sessionHandler('complete'), setupHandler('pending', setupPolled))
    const replace = jest.fn(() => Promise.resolve(true))

    render(<CheckoutReturnScreen sessionId={sessionId()} spaceId={faker.string.uuid()} />, { routerProps: { replace } })

    await waitFor(() => expect(setupPolled).toHaveBeenCalled())
    expect(screen.getByText('Setting up your Workspace')).toBeInTheDocument()
    expect(replace).not.toHaveBeenCalled()
  })

  it('opens the Workspace once its setup is applied, and clears the draft only after the navigation', async () => {
    server.use(sessionHandler('complete'), setupHandler('applied'))
    let finishNavigation = () => {}
    const replace = jest.fn(
      () =>
        new Promise<boolean>((resolve) => {
          finishNavigation = () => resolve(true)
        }),
    )
    const id = sessionId()
    const spaceId = faker.string.uuid()
    const draft = workspaceDraftBuilder().with({ ownerId: fakeUserId(), createdSpaceId: spaceId }).build()

    render(<CheckoutReturnScreen sessionId={id} spaceId={spaceId} />, {
      routerProps: { replace },
      initialReduxState: { workspaceDraft: draft },
    })

    await waitFor(() =>
      expect(replace).toHaveBeenCalledWith({ pathname: AppRoutes.spaces.index, query: { spaceId, sessionId: id } }),
    )
    expect(storedDraft()).toEqual(draft)

    await act(async () => finishNavigation())

    expect(storedDraft()).toEqual(EMPTY_WORKSPACE_DRAFT)
  })

  it('stops waiting after a minute and lets the user open the Workspace', async () => {
    jest.useFakeTimers()
    const setupPolled = jest.fn()
    server.use(sessionHandler('complete'), setupHandler('pending', setupPolled))
    const replace = jest.fn(() => Promise.resolve(true))
    const id = sessionId()
    const spaceId = faker.string.uuid()
    const { user } = renderWithUserEvent(<CheckoutReturnScreen sessionId={id} spaceId={spaceId} />, {
      routerProps: { replace },
      advanceTimers: jest.advanceTimersByTimeAsync,
    })
    await waitFor(() => expect(setupPolled).toHaveBeenCalled())

    await advanceClock(SETUP_TIMEOUT_MS)
    await user.click(screen.getByRole('button', { name: 'Go to Workspace' }))

    expect(replace).toHaveBeenCalledWith({ pathname: AppRoutes.spaces.index, query: { spaceId, sessionId: id } })
  })

  it('says when the setup cannot be loaded and loads it again on retry', async () => {
    server.use(
      sessionHandler('complete'),
      http.get(`${GATEWAY_URL}/v1/spaces/:id/setup`, () => new HttpResponse(null, { status: 500 })),
    )
    const replace = jest.fn(() => Promise.resolve(true))
    const spaceId = faker.string.uuid()
    const { user } = renderWithUserEvent(<CheckoutReturnScreen sessionId={sessionId()} spaceId={spaceId} />, {
      routerProps: { replace },
    })
    expect(await screen.findByText("We couldn't load your Workspace setup")).toBeInTheDocument()

    server.use(setupHandler('applied'))
    await user.click(screen.getByRole('button', { name: 'Try again' }))

    await waitFor(() =>
      expect(replace).toHaveBeenCalledWith(expect.objectContaining({ pathname: AppRoutes.spaces.index })),
    )
  })

  it('confirms the checkout again when the user retries after a failure', async () => {
    let attempts = 0
    const setupPolled = jest.fn()
    server.use(
      http.get(`${GATEWAY_URL}/v1/billing/sessions/:sessionId`, () => {
        attempts += 1
        return attempts === 1 ? new HttpResponse(null, { status: 500 }) : HttpResponse.json({ status: 'complete' })
      }),
      setupHandler('pending', setupPolled),
    )
    const { user } = renderWithUserEvent(<CheckoutReturnScreen sessionId={sessionId()} spaceId={faker.string.uuid()} />)

    await user.click(await screen.findByRole('button', { name: 'Try again' }))

    await waitFor(() => expect(setupPolled).toHaveBeenCalled())
    expect(screen.getByText('Setting up your Workspace')).toBeInTheDocument()
  })

  it('sends the user to the Workspace list when the draft lost the new Workspace', async () => {
    server.use(sessionHandler('complete'))
    const replace = jest.fn(() => Promise.resolve(true))
    const { user } = renderWithUserEvent(<CheckoutReturnScreen sessionId={sessionId()} spaceId={null} />, {
      routerProps: { replace },
    })

    await user.click(screen.getByRole('button', { name: 'Go to Workspaces' }))

    expect(screen.getByText("We couldn't find your new Workspace")).toBeInTheDocument()
    expect(replace).toHaveBeenCalledWith(AppRoutes.welcome.spaces)
  })
})
