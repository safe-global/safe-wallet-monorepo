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
  'del',
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
  'image',
  'pattern',
  'filter',
  'feBlend',
  'feColorMatrix',
  'feComposite',
  'feFlood',
  'feGaussianBlur',
  'feOffset',
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
  'stroke-dasharray',
  'stroke-miterlimit',
  'filter',
  'filterUnits',
  'color-interpolation-filters',
  'flood-opacity',
  'in',
  'in2',
  'k1',
  'k2',
  'k3',
  'k4',
  'mode',
  'operator',
  'result',
  'stdDeviation',
  'values',
  'dx',
  'dy',
  'patternUnits',
  'patternContentUnits',
  'mask',
  'maskUnits',
]

type EventInit = { value?: unknown; checked?: unknown; key?: unknown }

// The page sends only these fields back; the worker copies them onto the element and the event
// so React and the view read them as usual.
const dispatch = (type: string) =>
  function (this: Element & Record<string, unknown>, detail: EventInit = {}) {
    if ('value' in detail) this.value = detail.value
    if ('checked' in detail) this.checked = detail.checked
    const event = new Event(type, { bubbles: type !== 'load' && type !== 'error', cancelable: true }) as Event &
      Record<string, unknown>
    if (typeof detail.key === 'string') event.key = detail.key
    return event
  }

const EVENTS = ['click', 'input', 'change', 'keydown', 'submit', 'focus', 'blur']

// Element attribute names are lowercase (setAttribute('viewBox') stores `viewbox`); the page restores the casing.
export const REMOTE_ATTRIBUTES = HTML_ATTRIBUTES.map((name) => name.toLowerCase())

export const HtmlElement = createRemoteElement({
  attributes: REMOTE_ATTRIBUTES,
  events: {
    ...Object.fromEntries(EVENTS.map((type) => [type, { bubbles: true, dispatchEvent: dispatch(type) }])),
    // Media events do not bubble; the page only listens when the view does.
    load: { dispatchEvent: dispatch('load') },
    error: { dispatchEvent: dispatch('error') },
  },
})

const FIELDS = new Set(['input', 'textarea', 'select'])

// Libraries check tagName (Base UI wants a real BUTTON); Remote DOM still serializes the h-* localName.
// Fields keep their own name so React does not treat them as native inputs and fire onChange twice.
// data-* and aria-* carry state that styles and tests read (Base UI sets many); they are plain strings, so all pass.
export const DYNAMIC_ATTRIBUTE = /^(data|aria)-[a-z0-9-]+$/

class ForwardingElement extends HtmlElement {
  setAttribute(name: string, value: string) {
    super.setAttribute(name, value)
    if (DYNAMIC_ATTRIBUTE.test(name)) this.updateRemoteAttribute(name, value)
  }

  removeAttribute(name: string) {
    super.removeAttribute(name)
    if (DYNAMIC_ATTRIBUTE.test(name)) this.updateRemoteAttribute(name)
  }
}

export const defineHtmlElements = () => {
  for (const tag of HTML_TAGS) {
    const name = tag.toUpperCase()
    customElements.define(
      `h-${tag.toLowerCase()}`,
      FIELDS.has(tag)
        ? class extends ForwardingElement {}
        : class extends ForwardingElement {
            get tagName() {
              return name
            }
          },
    )
  }
}

const TAGS = new Set<string>(HTML_TAGS)

export const remoteTag = (tag: string): string | null => (TAGS.has(tag) ? `h-${tag.toLowerCase()}` : null)
