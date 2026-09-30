import { readFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Connecting a wallet stacks three overlays that live in three different styling systems:
 *
 *   onboard's connect modal   `--onboard-modal-z-index`  (onboard.css)
 *   the WalletConnect QR modal `--wcm-z-index`           (wallets.ts, a JS theme variable)
 *   the private key prompt     `--z-above-onboard`       (shadcn.css)
 *
 * The last two are opened from inside the first, so both have to beat it. Nothing in the type
 * system or the CSS connects them, and getting it wrong is not a cosmetic bug: onboard's
 * "Connecting to WalletConnect…" panel paints over the QR code and the wallet can never be
 * connected. This test is the only link between the three numbers.
 */
const WEB_SRC = join(__dirname, '..', '..', '..')

const numberFrom = (source: string, pattern: RegExp, label: string): number => {
  const match = source.match(pattern)
  if (!match) throw new Error(`Could not find ${label}`)
  return Number(match[1])
}

const ONBOARD_CSS = readFileSync(join(WEB_SRC, 'styles', 'onboard.css'), 'utf8')
const SHADCN_CSS = readFileSync(join(WEB_SRC, 'styles', 'shadcn.css'), 'utf8')
const WALLETS_TS = readFileSync(join(WEB_SRC, 'hooks', 'wallets', 'wallets.ts'), 'utf8')

const onboardModal = numberFrom(ONBOARD_CSS, /--onboard-modal-z-index:\s*(\d+)/, '--onboard-modal-z-index')
const aboveOnboard = numberFrom(SHADCN_CSS, /--z-above-onboard:\s*(\d+)/, '--z-above-onboard')
const walletConnectModal = numberFrom(WALLETS_TS, /'--wcm-z-index':\s*'(\d+)'/, "the QR modal's --wcm-z-index")

describe('wallet modal stacking order', () => {
  it('puts the WalletConnect QR modal above onboard’s connect modal', () => {
    // Below this, onboard's "Connecting to WalletConnect…" panel covers the QR code.
    expect(walletConnectModal).toBeGreaterThan(onboardModal)
  })

  it('puts the private key prompt above onboard’s connect modal', () => {
    expect(aboveOnboard).toBeGreaterThan(onboardModal)
  })

  it('keeps the QR modal on the shared above-onboard layer', () => {
    expect(walletConnectModal).toBe(aboveOnboard)
  })

  it('keeps both above-onboard overlays below the picker layer', () => {
    const picker = numberFrom(SHADCN_CSS, /--z-picker:\s*(\d+)/, '--z-picker')

    expect(picker).toBeGreaterThan(walletConnectModal)
    expect(picker).toBeGreaterThan(aboveOnboard)
  })
})
