/**
 * Drives the emulated Trezor of the isolated stack through infra/scripts/trezor_emulator.py, as a user drives the
 * device. The wallet reaches the device through Trezor Connect's popup and Trezor Bridge.
 */

/** The label of the trezor-emulator service in infra/docker-compose.test.yml, which Trezor Connect's device list shows */
export const TREZOR_LABEL = 'Safe E2E'
const POLL_INTERVAL_MS = 200
// A device screen changes within milliseconds of a press; a request arrives within seconds of a click in the popup.
const SCREEN_TIMEOUT_MS = 15_000

export type TrezorScreen = { title: string; body: string }

function emulatorUrl(): string {
  const url = process.env.TREZOR_EMULATOR_URL
  if (!url) throw new Error('No Trezor emulator: start the isolated stack again, its manifest has no trezorEmulatorUrl')
  return url
}

const isHome = (screen: TrezorScreen): boolean => screen.title === '' && screen.body === TREZOR_LABEL

// Between two review screens the device shows a screen without a title, such as "no main component", while it waits
// for the host; a press there ends the review.
const isTransition = (screen: TrezorScreen): boolean => screen.title === '' && !isHome(screen)

const describe = (screen: TrezorScreen): string => `${screen.title}: ${screen.body}`

export class TrezorEmulator {
  private readonly baseUrl: string

  constructor(baseUrl: string = emulatorUrl()) {
    this.baseUrl = baseUrl
  }

  /** Confirms each screen of the open review until the device returns home. Returns every screen of the review. */
  async approve(): Promise<TrezorScreen[]> {
    const reviewed: TrezorScreen[] = []
    let screen = await this.waitForScreen((next) => !isHome(next) && !isTransition(next))
    while (!isHome(screen)) {
      reviewed.push(screen)
      await this.request('POST', '/press-yes')
      const previous = describe(screen)
      screen = await this.waitForScreen((next) => describe(next) !== previous && !isTransition(next))
    }
    return reviewed
  }

  /** A PNG of the device screen, for a failure report. */
  async screenshot(): Promise<Buffer> {
    const { png } = (await this.request('GET', '/screenshot')) as { png: string }
    return Buffer.from(png, 'base64')
  }

  private async waitForScreen(isExpected: (screen: TrezorScreen) => boolean): Promise<TrezorScreen> {
    const deadline = Date.now() + SCREEN_TIMEOUT_MS
    let screen = await this.readScreen()
    while (!isExpected(screen)) {
      if (Date.now() > deadline) throw new Error(`The Trezor screen stayed at "${describe(screen)}"`)
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS))
      screen = await this.readScreen()
    }
    return screen
  }

  private async readScreen(): Promise<TrezorScreen> {
    return (await this.request('GET', '/screen')) as TrezorScreen
  }

  private async request(method: string, path: string): Promise<unknown> {
    const response = await fetch(`${this.baseUrl}${path}`, { method })
    const body = (await response.json()) as { error?: string }
    if (!response.ok) throw new Error(`Trezor emulator ${method} ${path} answered ${response.status}: ${body.error}`)
    return body
  }
}
