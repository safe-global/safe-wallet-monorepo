/**
 * Drives the emulated Ledger (Speculos) of the isolated stack through its REST API, as a user drives the device.
 *
 * The wallet's APDU calls time out after 10 s, so a review must finish within that time once it starts.
 */
const POLL_INTERVAL_MS = 200
// A device screen changes within milliseconds of a button press; a request arrives within seconds of a click.
const SCREEN_TIMEOUT_MS = 15_000
const REJECT_SCREEN = 'Reject'
const IDLE_SCREEN = 'app is ready'
// "Message signed" or "Transaction signed" stays on screen for a moment after an approval.
const SIGNED_SCREEN = / signed$/
// "To accept risk, press both buttons" opens a review of data the device cannot decode; both buttons accept it.
const ACCEPT_RISK = 'both buttons'
// From the home screen: App settings → Blind signing.
const BLIND_SIGNING_ITEM = 'Blind signing'
// Settings that follow Blind signing before Back.
const SETTINGS_AFTER_BLIND_SIGNING = 6

type Button = 'left' | 'right' | 'both'

function emulatorUrl(): string {
  const url = process.env.NEXT_PUBLIC_LEDGER_EMULATOR_URL
  if (!url) throw new Error('No Ledger emulator: start the isolated stack again, its manifest has no ledgerEmulatorUrl')
  return url
}

export class LedgerEmulator {
  private readonly baseUrl: string

  constructor(baseUrl: string = emulatorUrl()) {
    this.baseUrl = baseUrl
  }

  /** Turns blind signing on, which Safe transactions need: the device cannot decode their data. */
  async enableBlindSigning(): Promise<void> {
    await this.waitForScreen((screen) => screen.includes(IDLE_SCREEN))
    await this.press('right')
    await this.press('both')
    const setting = await this.waitForScreen((screen) => screen.includes(BLIND_SIGNING_ITEM))
    if (setting.includes('Disabled')) {
      await this.press('both')
      await this.waitForScreen((screen) => screen.includes('Enabled'))
    }
    for (let item = 0; item < SETTINGS_AFTER_BLIND_SIGNING; item++) await this.press('right')
    await this.waitForScreen((screen) => screen === 'Back')
    await this.press('both')
    await this.press('left')
    await this.waitForScreen((screen) => screen.includes(IDLE_SCREEN))
  }

  /**
   * Reviews the open request screen by screen and approves it on `approvalScreen`, such as "Sign message" or
   * "Accept risk and sign transaction". Returns every screen of the review, so a test can check what it showed.
   */
  async approve(approvalScreen: string): Promise<string[]> {
    const reviewed: string[] = []
    let screen = await this.waitForScreen(
      (text) => text !== '' && !text.includes(IDLE_SCREEN) && !SIGNED_SCREEN.test(text),
    )
    while (!screen.includes(approvalScreen)) {
      if (screen.includes(REJECT_SCREEN)) {
        throw new Error(`The Ledger review passed "${approvalScreen}"; it showed: ${reviewed.join(' / ')}`)
      }
      reviewed.push(screen)
      await this.press(screen.includes(ACCEPT_RISK) ? 'both' : 'right')
      const previous = screen
      screen = await this.waitForScreen((text) => text !== '' && text !== previous)
    }
    reviewed.push(screen)
    await this.press('both')
    return reviewed
  }

  /** A PNG of the device screen, for a failure report. */
  async screenshot(): Promise<Buffer> {
    const response = await fetch(`${this.baseUrl}/screenshot`)
    if (!response.ok) throw new Error(`Ledger emulator GET /screenshot answered ${response.status}`)
    return Buffer.from(await response.arrayBuffer())
  }

  private async waitForScreen(isExpected: (screen: string) => boolean): Promise<string> {
    const deadline = Date.now() + SCREEN_TIMEOUT_MS
    let screen = await this.readScreen()
    while (!isExpected(screen)) {
      if (Date.now() > deadline) throw new Error(`The Ledger screen stayed at "${screen}"`)
      await sleep(POLL_INTERVAL_MS)
      screen = await this.readScreen()
    }
    return screen
  }

  /** The texts of the open screen, joined by spaces. */
  private async readScreen(): Promise<string> {
    const { events } = (await this.request('GET', '/events?currentscreenonly=true')) as { events: { text: string }[] }
    return events.map((event) => event.text.trim()).join(' ')
  }

  private async press(button: Button): Promise<void> {
    await this.request('POST', `/button/${button}`, { action: 'press-and-release' })
  }

  private async request(method: string, path: string, body?: unknown): Promise<unknown> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
    if (!response.ok) throw new Error(`Ledger emulator ${method} ${path} answered ${response.status}`)
    const text = await response.text()
    return text ? JSON.parse(text) : null
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
