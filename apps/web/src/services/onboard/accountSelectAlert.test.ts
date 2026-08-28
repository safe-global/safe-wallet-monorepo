import { styleAccountSelectAlert } from './accountSelectAlert'

const STYLE_ID = 'safe-account-select-alert'

/** The picker as `@web3-onboard/hw-common` mounts it: an open shadow root holding the control bar. */
const mountPicker = (): ShadowRoot => {
  const host = document.createElement('account-select')
  const root = host.attachShadow({ mode: 'open' })
  root.innerHTML = `
    <div class="table-controls svelte-1t799sf">
      <div class="checkbox-container svelte-1t799sf"></div>
      <span class="error-msg svelte-1t799sf">Unlock your Ledger and try again.</span>
      <button class="scan-accounts-btn svelte-1t799sf" id="scan-accounts">Scan Accounts</button>
    </div>
  `
  document.body.appendChild(host)
  return root
}

const readStyle = (root: ShadowRoot): string => root.getElementById(STYLE_ID)?.textContent ?? ''

describe('styleAccountSelectAlert', () => {
  afterEach(() => {
    document.body.innerHTML = ''
    document.documentElement.removeAttribute('data-theme')
  })

  it('skins the scan error as the destructive Alert', () => {
    const root = mountPicker()

    styleAccountSelectAlert()

    const css = readStyle(root)
    expect(css).toContain('#fff4f6') // Alert `--error-subtle`
    expect(css).toContain('#dc2626') // Alert `--destructive`, on the icon
    expect(css).toContain('border-radius: 6px') // `rounded-md`
    expect(css).toContain('font-size: 0.875rem') // `text-sm`
    expect(css).toContain('mask:') // the severity icon, painted through a mask
  })

  it('outranks the widget’s own scoped rule without naming its build hash', () => {
    const root = mountPicker()

    styleAccountSelectAlert()

    const css = readStyle(root)
    // Svelte ships `.error-msg.svelte-<hash>`; the hash changes on every rebuild
    // of the package, so the override has to win on repeated classes instead.
    expect(css).toContain('.error-msg.error-msg.error-msg')
    expect(css).not.toContain('svelte-')
  })

  it('leaves the element where the widget put it', () => {
    const root = mountPicker()

    styleAccountSelectAlert()

    // Only the rule for the element itself matters here: the container rule
    // before it lifts the bar's fixed height, and the `::before` block after it
    // sizes the icon, so both legitimately carry layout properties.
    const [, ...elementRuleParts] = readStyle(root).split('::before')[0].split('.error-msg')
    const elementRule = elementRuleParts.join('.error-msg')
    for (const layoutProperty of ['position:', 'order:', 'top:', 'left:', 'max-width:', 'width:']) {
      expect(elementRule).not.toContain(layoutProperty)
    }
    expect(root.querySelector('.table-controls .error-msg')).not.toBeNull()
  })

  it('lets the control bar grow instead of clipping a taller alert', () => {
    const root = mountPicker()

    styleAccountSelectAlert()

    // The widget pins the bar at `height: 3.5rem`; a padded alert on three lines
    // is taller than that and would otherwise spill past the bar's edge.
    const containerRule = readStyle(root).split('.error-msg')[0]
    expect(containerRule).toContain('.table-controls')
    expect(containerRule).toContain('height: auto')
    expect(containerRule).toContain('min-height: 3.5rem')
  })

  it('uses the dark palette when the app is in dark mode', () => {
    document.documentElement.setAttribute('data-theme', 'dark')
    const root = mountPicker()

    styleAccountSelectAlert()

    const css = readStyle(root)
    expect(css).toContain('#2f2527')
    expect(css).toContain('#ff5f72')
    expect(css).not.toContain('#fff4f6')
  })

  it('refreshes an already-styled picker rather than stacking stylesheets', () => {
    const root = mountPicker()
    styleAccountSelectAlert()

    document.documentElement.setAttribute('data-theme', 'dark')
    styleAccountSelectAlert()

    expect(root.querySelectorAll(`#${STYLE_ID}`)).toHaveLength(1)
    expect(readStyle(root)).toContain('#2f2527')
  })

  it('styles a freshly mounted picker even when the previous one is still in the DOM', () => {
    // `accountSelect` destroys the Svelte app on close but leaves its host behind,
    // so a second connect attempt adds another <account-select> to the body.
    const stale = mountPicker()
    const fresh = mountPicker()

    styleAccountSelectAlert()

    expect(readStyle(stale)).not.toBe('')
    expect(readStyle(fresh)).not.toBe('')
  })

  it('does nothing when no picker is mounted', () => {
    expect(() => styleAccountSelectAlert()).not.toThrow()
  })
})
