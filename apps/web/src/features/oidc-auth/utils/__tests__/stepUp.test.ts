/**
 * @jest-environment-options {"url": "https://app.safe.global/spaces/members?spaceId=42"}
 */
import { GATEWAY_URL } from '@/config/gateway'
import { navigateTo } from '@/utils/navigation'
import { getStepUpOutcome, listenForStepUp, openStepUpPopup, startStepUp, STEP_UP_CHANNEL } from '../stepUp'
import { STEP_UP_CANCELLED } from '../../constants'

jest.mock('@/utils/navigation')

class FakeChannel {
  static instances: FakeChannel[] = []
  onmessage: ((event: MessageEvent) => void) | null = null
  isClosed = false

  constructor(public name: string) {
    FakeChannel.instances.push(this)
  }

  close() {
    this.isClosed = true
  }
}

const getAuthorizeUrl = (url: string) => new URL(url)

describe('startStepUp', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    window.history.replaceState(null, '', '/spaces/members?spaceId=42')
  })

  it('should send this tab to the gateway authorize endpoint with elevate=true and return to this page', () => {
    startStepUp()

    const url = getAuthorizeUrl(jest.mocked(navigateTo).mock.calls[0][0])
    expect(url.origin + url.pathname).toBe(`${GATEWAY_URL}/v1/auth/oidc/authorize`)
    expect(url.searchParams.get('elevate')).toBe('true')
    expect(url.searchParams.get('redirect_url')).toBe('https://app.safe.global/spaces/members?spaceId=42')
  })

  it('should strip stale error params from the return URL', () => {
    window.history.replaceState(null, '', '/spaces/members?spaceId=42&error=access_denied&error_description=nope')

    startStepUp()

    const url = getAuthorizeUrl(jest.mocked(navigateTo).mock.calls[0][0])
    expect(url.searchParams.get('redirect_url')).toBe('https://app.safe.global/spaces/members?spaceId=42')
  })
})

describe('openStepUpPopup', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should open the authorize endpoint in a popup that returns to the static completion page', () => {
    const popup = {} as Window
    const open = jest.spyOn(window, 'open').mockReturnValue(popup)

    expect(openStepUpPopup()).toBe(popup)

    const [href, target] = open.mock.calls[0]
    const url = getAuthorizeUrl(String(href))
    expect(url.searchParams.get('elevate')).toBe('true')
    expect(url.searchParams.get('redirect_url')).toBe('https://app.safe.global/step-up-complete.htm')
    expect(target).toBe(STEP_UP_CHANNEL)
  })

  it('should centre the popup over the current window', () => {
    // jsdom defines these as plain values, not getters, so they are replaced and restored by hand.
    const geometry = { screenX: 100, screenY: 50, outerWidth: 1280, outerHeight: 800 }
    const originals = Object.keys(geometry).map((key) => [key, Object.getOwnPropertyDescriptor(window, key)] as const)
    Object.entries(geometry).forEach(([key, value]) =>
      Object.defineProperty(window, key, { value, configurable: true }),
    )
    const open = jest.spyOn(window, 'open').mockReturnValue(null)

    try {
      openStepUpPopup()
      expect(open.mock.calls[0][2]).toBe('popup,width=480,height=720,left=500,top=90')
    } finally {
      originals.forEach(([key, descriptor]) =>
        descriptor ? Object.defineProperty(window, key, descriptor) : Reflect.deleteProperty(window, key),
      )
    }
  })

  it('should return null when the browser blocks the popup', () => {
    jest.spyOn(window, 'open').mockReturnValue(null)

    expect(openStepUpPopup()).toBeNull()
  })
})

describe('getStepUpOutcome', () => {
  it('should read a message without an error as an elevated session', () => {
    expect(getStepUpOutcome({ error: null, errorDescription: null })).toBe('elevated')
  })

  it('should read the documented Auth0 cancellation as a cancel', () => {
    expect(getStepUpOutcome({ error: STEP_UP_CANCELLED.error, errorDescription: STEP_UP_CANCELLED.description })).toBe(
      'cancelled',
    )
  })

  it('should read any other access_denied as a failure, because an Auth0 Action can deny access too', () => {
    expect(getStepUpOutcome({ error: 'access_denied', errorDescription: 'Blocked by a rule' })).toBe('failed')
  })

  it.each([undefined, null, 'elevated', 42])('should read a malformed message (%p) as a failure', (message) => {
    expect(getStepUpOutcome(message)).toBe('failed')
  })
})

describe('listenForStepUp', () => {
  const originalChannel = globalThis.BroadcastChannel

  beforeEach(() => {
    FakeChannel.instances = []
    globalThis.BroadcastChannel = FakeChannel as unknown as typeof BroadcastChannel
  })

  afterAll(() => {
    globalThis.BroadcastChannel = originalChannel
  })

  it('should report the outcome of a message on the step-up channel', () => {
    const onOutcome = jest.fn()
    listenForStepUp(onOutcome)

    const [channel] = FakeChannel.instances
    channel.onmessage?.({ data: { error: null } } as MessageEvent)

    expect(channel.name).toBe(STEP_UP_CHANNEL)
    expect(onOutcome).toHaveBeenCalledWith('elevated')
  })

  it('should close the channel on cleanup', () => {
    const stopListening = listenForStepUp(jest.fn())

    stopListening()

    expect(FakeChannel.instances[0].isClosed).toBe(true)
  })
})
