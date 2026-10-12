import { createRemoteElement } from '@remote-dom/core/elements'

// Tags a view may render; each becomes a remote `h-<tag>` element the page draws through the allowlist.
export const HTML_TAGS = [
  'div',
  'span',
  'p',
  'section',
  'article',
  'header',
  'footer',
  'nav',
  'main',
  'aside',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'ul',
  'ol',
  'li',
  'dl',
  'dt',
  'dd',
  'strong',
  'em',
  'b',
  'i',
  'u',
  's',
  'small',
  'sup',
  'sub',
  'code',
  'pre',
  'kbd',
  'mark',
  'br',
  'hr',
  'table',
  'thead',
  'tbody',
  'tfoot',
  'tr',
  'th',
  'td',
  'caption',
  'colgroup',
  'col',
  'label',
  'button',
  'input',
  'textarea',
  'select',
  'option',
  'form',
  'fieldset',
  'legend',
  'a',
  'img',
  'figure',
  'figcaption',
  'details',
  'summary',
  'time',
  'abbr',
  'svg',
  'g',
  'path',
  'circle',
  'ellipse',
  'rect',
  'line',
  'polyline',
  'polygon',
  'defs',
  'clipPath',
  'linearGradient',
  'radialGradient',
  'stop',
  'mask',
  'use',
  'title',
  'desc',
  'text',
  'tspan',
] as const

export const HTML_ATTRIBUTES = [
  'class',
  'id',
  'role',
  'title',
  'tabindex',
  'hidden',
  'dir',
  'lang',
  'remote-style',
  'data-testid',
  'data-state',
  'data-slot',
  'data-variant',
  'data-size',
  'data-active',
  'data-disabled',
  'aria-label',
  'aria-labelledby',
  'aria-describedby',
  'aria-hidden',
  'aria-expanded',
  'aria-selected',
  'aria-checked',
  'aria-disabled',
  'aria-current',
  'aria-live',
  'aria-busy',
  'aria-invalid',
  'aria-controls',
  'aria-pressed',
  'aria-valuenow',
  'aria-valuemin',
  'aria-valuemax',
  'aria-orientation',
  'href',
  'target',
  'rel',
  'src',
  'alt',
  'width',
  'height',
  'loading',
  'datetime',
  'colspan',
  'rowspan',
  'scope',
  'type',
  'name',
  'value',
  'placeholder',
  'disabled',
  'checked',
  'readonly',
  'required',
  'for',
  'min',
  'max',
  'step',
  'maxlength',
  'minlength',
  'pattern',
  'autocomplete',
  'inputmode',
  'multiple',
  'selected',
  'open',
  'rows',
  'viewBox',
  'xmlns',
  'fill',
  'stroke',
  'stroke-width',
  'stroke-linecap',
  'stroke-linejoin',
  'fill-rule',
  'clip-rule',
  'd',
  'x',
  'y',
  'x1',
  'y1',
  'x2',
  'y2',
  'cx',
  'cy',
  'r',
  'rx',
  'ry',
  'points',
  'transform',
  'opacity',
  'fill-opacity',
  'stroke-opacity',
  'offset',
  'stop-color',
  'stop-opacity',
  'clip-path',
  'gradientUnits',
  'gradientTransform',
  'preserveAspectRatio',
  'text-anchor',
  'dominant-baseline',
]

type EventInit = { value?: unknown; checked?: unknown; key?: unknown }

// The page sends only these fields back; the worker copies them onto the element and the event
// so React and the view read them as usual.
const dispatch = (type: string) =>
  function (this: Element & Record<string, unknown>, detail: EventInit = {}) {
    if ('value' in detail) this.value = detail.value
    if ('checked' in detail) this.checked = detail.checked
    const event = new Event(type, { bubbles: true, cancelable: true }) as Event & Record<string, unknown>
    if (typeof detail.key === 'string') event.key = detail.key
    return event
  }

const EVENTS = ['click', 'input', 'change', 'keydown', 'submit', 'focus', 'blur']

export const HtmlElement = createRemoteElement({
  attributes: HTML_ATTRIBUTES,
  events: Object.fromEntries(EVENTS.map((type) => [type, { bubbles: true, dispatchEvent: dispatch(type) }])),
})

const FIELDS = new Set(['input', 'textarea', 'select'])

// Libraries check tagName (Base UI wants a real BUTTON); Remote DOM still serializes the h-* localName.
// Fields keep their own name so React does not treat them as native inputs and fire onChange twice.
export const defineHtmlElements = () => {
  for (const tag of HTML_TAGS) {
    const name = tag.toUpperCase()
    customElements.define(
      `h-${tag.toLowerCase()}`,
      FIELDS.has(tag)
        ? class extends HtmlElement {}
        : class extends HtmlElement {
            get tagName() {
              return name
            }
          },
    )
  }
}

const TAGS = new Set<string>(HTML_TAGS)

export const remoteTag = (tag: string): string | null => (TAGS.has(tag) ? `h-${tag.toLowerCase()}` : null)
