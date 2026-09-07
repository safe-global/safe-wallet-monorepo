/**
 * The hardware-wallet account picker is `@web3-onboard/hw-common`'s own Svelte
 * widget. We choose the words it shows — but not how it draws them, and its
 * default for a scan failure is bare red text wedged into the control bar
 * between the checkbox and the Scan Accounts button.
 *
 * The widget mounts in an *open* shadow root, and that is the seam: we append
 * one stylesheet to it that re-skins `.error-msg` in place as the app's
 * destructive Alert — tinted surface, rounded corners, severity icon (WA-3243).
 * The element keeps its slot and its own positioning; only its skin changes.
 */

const STYLE_ID = 'safe-account-select-alert'

/**
 * `Alert` variant=destructive, outlined=false, as shadcn.css resolves it.
 * Hardcoded because those tokens are defined on `.shadcn-scope`, which is
 * applied to wrappers inside the React tree — the picker is appended to
 * `<body>`, outside every one of them, so it inherits none of them. Text colour
 * still comes from a `:root` token, which does reach the shadow tree.
 */
const ALERT_PALETTE = {
  light: { background: '#fff4f6', icon: '#dc2626' },
  dark: { background: '#2f2527', icon: '#ff5f72' },
} as const

/** lucide `circle-alert` (the Alert's own destructive icon), as a mask so it takes the palette colour. */
const ICON_MASK =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23000' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='12' r='10'/%3E%3Cpath d='M12 8v4'/%3E%3Cpath d='M12 16h.01'/%3E%3C/svg%3E\") center / contain no-repeat"

/**
 * Svelte scopes its own rule as `.error-msg.svelte-<hash>`, so a single class
 * would lose on specificity. The class is repeated to outrank it without
 * hardcoding the hash, which changes whenever they rebuild the package.
 */
const TARGET = '.error-msg.error-msg.error-msg'

/**
 * The bar holding the checkbox, the error and the Scan Accounts button. The
 * widget pins it to a fixed `height: 3.5rem`, which a tinted, padded alert
 * spills out of as soon as the sentence needs a third line. Letting it grow is
 * the one concession the skin needs; nothing moves, the bar just gets taller.
 */
const CONTAINER = '.table-controls.table-controls.table-controls'

const buildCss = ({ background, icon }: (typeof ALERT_PALETTE)[keyof typeof ALERT_PALETTE]): string => `
${CONTAINER} {
  height: auto;
  min-height: 3.5rem;
}
${TARGET} {
  display: inline-flex;
  align-items: flex-start;
  gap: 0.5rem;
  box-sizing: border-box;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  background: ${background};
  color: var(--color-text-primary, inherit);
  font-size: 0.875rem;
  line-height: 1.25;
  text-align: left;
}
${TARGET}::before {
  content: '';
  flex: none;
  width: 1rem;
  height: 1rem;
  margin-top: 0.0625rem;
  background-color: ${icon};
  -webkit-mask: ${ICON_MASK};
  mask: ${ICON_MASK};
}
`

const isDarkMode = (): boolean => document.documentElement.getAttribute('data-theme') === 'dark'

/**
 * Skins the picker's scan error as an Alert.
 *
 * Safe to call on every open: `accountSelect` mounts a fresh `<account-select>`
 * each time and leaves the previous one behind, so every host is visited and
 * an already-styled one is only refreshed (the theme may have changed since).
 */
export const styleAccountSelectAlert = (): void => {
  if (typeof document === 'undefined') return

  const css = buildCss(ALERT_PALETTE[isDarkMode() ? 'dark' : 'light'])

  document.querySelectorAll('account-select').forEach((host) => {
    const root = host.shadowRoot
    if (!root) return

    const existing = root.getElementById(STYLE_ID)
    if (existing) {
      existing.textContent = css
      return
    }

    const style = document.createElement('style')
    style.id = STYLE_ID
    style.textContent = css
    root.appendChild(style)
  })
}
