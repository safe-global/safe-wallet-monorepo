export const PIN_LAYER_ATTR = 'data-pin-layer'
const SCRIM_SLOTS = new Set(['sheet-overlay', 'dialog-overlay', 'alert-dialog-overlay'])

export type PinPoint = { element: Element; x: number; y: number }
export type Pin = { path: string; x: number; y: number }

const percent = (offset: number, size: number) => (size ? Math.round((offset / size) * 1000) / 10 : 50)
const isStableId = (id: string) => /^[A-Za-z][\w-]*$/.test(id) && !id.startsWith('base-ui')

// The scrim sits over the page while the drawer is open, so look through it to the element underneath.
export function resolvePinTarget(clientX: number, clientY: number): PinPoint | null {
  const element = document
    .elementsFromPoint(clientX, clientY)
    .find(
      (el) =>
        el !== document.documentElement &&
        el !== document.body &&
        !el.closest(`[${PIN_LAYER_ATTR}]`) &&
        !SCRIM_SLOTS.has(el.getAttribute('data-slot') ?? ''),
    )
  if (!element) return null
  const rect = element.getBoundingClientRect()
  return { element, x: percent(clientX - rect.left, rect.width), y: percent(clientY - rect.top, rect.height) }
}

export function cssPath(element: Element): string {
  const parts: string[] = []
  let node: Element | null = element
  while (node && node !== document.body && node !== document.documentElement) {
    if (node.id && isStableId(node.id)) {
      parts.unshift(`#${node.id}`)
      break
    }
    const tag = node.tagName
    const siblings: Element[] = node.parentElement
      ? Array.from(node.parentElement.children).filter((child) => child.tagName === tag)
      : []
    parts.unshift(
      siblings.length > 1 ? `${tag.toLowerCase()}:nth-of-type(${siblings.indexOf(node) + 1})` : tag.toLowerCase(),
    )
    node = node.parentElement
  }
  return parts.join(' > ')
}

export function findByCssPath(path: string): Element | null {
  try {
    return document.querySelector(path)
  } catch {
    return null
  }
}

const KIND_BY_ROLE: Record<string, string> = {
  button: 'button',
  a: 'link',
  link: 'link',
  menuitem: 'menu item',
  menuitemcheckbox: 'menu option',
  menuitemradio: 'menu option',
  tab: 'tab',
  th: 'column header',
  columnheader: 'column header',
  td: 'cell',
  cell: 'cell',
  input: 'field',
  textbox: 'field',
  searchbox: 'search field',
  h1: 'heading',
  h2: 'heading',
  h3: 'heading',
}
const CONTROL_SELECTOR =
  'button, a, input, textarea, [role="button"], [role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"], [role="tab"], th, td, h1, h2, h3'
const clean = (text: string, max = 60) => {
  const value = text.replace(/\s+/g, ' ').trim()
  return value.length > max ? `${value.slice(0, max - 1)}…` : value
}

export function describeTarget(element: Element): { where: string; row?: string } {
  const areas: string[] = []
  for (let node: Element | null = element; node; node = node.parentElement) {
    const area = node.getAttribute('data-prototype-element')
    if (area) areas.unshift(area)
  }
  const control = element.closest(CONTROL_SELECTOR) ?? element
  const role = control.getAttribute('role') ?? control.tagName.toLowerCase()
  const label = clean(control.getAttribute('aria-label') || control.textContent || '')
  const kind = KIND_BY_ROLE[role] ?? 'element'
  const row = element
    .closest('tr')
    ?.querySelector('button[aria-label^="Open "]')
    ?.getAttribute('aria-label')
    ?.replace(/^Open /, '')
  return { where: [...areas, label ? `"${label}" ${kind}` : kind].join(' › '), row: row || undefined }
}

export function buildPinLink(href: string, pin: Pin, extra: Record<string, string | undefined> = {}): string {
  const url = new URL(href)
  url.searchParams.set('pin', `${pin.x}:${pin.y}@${pin.path}`)
  Object.entries(extra).forEach(([key, value]) =>
    value ? url.searchParams.set(key, value) : url.searchParams.delete(key),
  )
  return url.toString()
}

// `issue` is added by /design.feedback once the comment is filed as a sub-issue.
export function parsePinIssue(search: string): string | undefined {
  const issue = new URLSearchParams(search).get('issue')
  return issue && /^[A-Z][A-Z0-9]*-\d+$/.test(issue) ? issue : undefined
}

export const parsePinComment = (search: string) => new URLSearchParams(search).get('c')?.slice(0, 500) || undefined

export function parsePin(search: string): Pin | null {
  const raw = new URLSearchParams(search).get('pin')
  const at = raw?.indexOf('@') ?? -1
  if (!raw || at < 0) return null
  const [x, y] = raw.slice(0, at).split(':').map(Number)
  const path = raw.slice(at + 1)
  return Number.isFinite(x) && Number.isFinite(y) && path ? { path, x, y } : null
}
