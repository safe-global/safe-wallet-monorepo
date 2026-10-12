import { createElement, useCallback, useEffect, useRef, type ReactNode, type SyntheticEvent } from 'react'
import { createRemoteComponentRenderer } from '@remote-dom/react/host'
import { DYNAMIC_ATTRIBUTE, HTML_ATTRIBUTES, HTML_TAGS } from './frame/html'
import { usePropUrls, useViewToken } from './slots'

type Listener = (detail?: unknown) => void
type ElementProps = Record<string, unknown> & { children?: ReactNode }

const ATTRIBUTES = new Set(HTML_ATTRIBUTES)
const URL_ATTRIBUTES = new Set(['href', 'src'])
const FIELD_TAGS = new Set(['input', 'textarea', 'select'])
const UNSAFE_STYLE = /url\s*\(|expression\s*\(|@import|image-set|\\/i
const BOOLEANS = new Set(['hidden', 'disabled', 'checked', 'readonly', 'required', 'multiple', 'selected', 'open'])
const REACT_NAMES: Record<string, string> = {
  class: 'className',
  for: 'htmlFor',
  tabindex: 'tabIndex',
  readonly: 'readOnly',
  maxlength: 'maxLength',
  minlength: 'minLength',
  autocomplete: 'autoComplete',
  inputmode: 'inputMode',
  colspan: 'colSpan',
  rowspan: 'rowSpan',
  datetime: 'dateTime',
}

const reactName = (name: string) =>
  REACT_NAMES[name] ??
  (name.includes('-') && !name.startsWith('data-') && !name.startsWith('aria-')
    ? name.replace(/-([a-z])/g, (_, char: string) => char.toUpperCase())
    : name)

// Hosts views may link to or load images from; everything else is dropped.
const allowedHosts = new Set(['safe.global'])

export const allowRemoteUrlHosts = (hosts: string[]) => hosts.forEach((host) => allowedHosts.add(host))

const isAllowedHost = (host: string) =>
  [...allowedHosts].some((allowed) => host === allowed || host.endsWith(`.${allowed}`))

export const isAllowedUrl = (value: string, attribute: string, propOrigins: Set<string> = new Set()): boolean => {
  if (/^data:image\/(png|jpe?g|gif|webp);/i.test(value)) return attribute === 'src' || attribute === 'href'
  try {
    const url = new URL(value, window.location.href)
    if (url.origin === window.location.origin) return true
    return url.protocol === 'https:' && (isAllowedHost(url.hostname) || propOrigins.has(url.origin))
  } catch {
    return false
  }
}

export const safeAttributes = (props: ElementProps, propOrigins: Set<string>) => {
  const safe: Record<string, unknown> = {}
  for (const [name, value] of Object.entries(props)) {
    if ((!ATTRIBUTES.has(name) && !DYNAMIC_ATTRIBUTE.test(name)) || typeof value !== 'string') continue
    if (URL_ATTRIBUTES.has(name) && !isAllowedUrl(value, name, propOrigins)) continue
    // SVG paint and filter references may only point inside the document.
    if (name !== 'remote-style' && /url\s*\(/i.test(value) && !/^url\(#[\w-]+\)$/.test(value.trim())) continue
    if (name === 'remote-style') {
      if (!UNSAFE_STYLE.test(value))
        safe.style = Object.fromEntries(
          value
            .split(';')
            .filter(Boolean)
            .map((rule) => {
              const index = rule.indexOf(':')
              const key = rule.slice(0, index).trim()
              return [
                key.startsWith('--') ? key : key.replace(/-([a-z])/g, (_, char: string) => char.toUpperCase()),
                rule.slice(index + 1).trim(),
              ]
            }),
        )
      continue
    }
    if (name === 'target') safe.target = value === '_blank' ? '_blank' : undefined
    else if (name === 'tabindex') safe.tabIndex = Number(value)
    else if (BOOLEANS.has(name)) safe[reactName(name)] = true
    else safe[reactName(name)] = value
  }
  if (safe.target === '_blank') safe.rel = 'noopener noreferrer'
  return safe
}

// Elements the page drew, by view. Slot content in between belongs to the app or to nested views.
const drawn = new WeakMap<Element, object>()

const innermostDrawn = (target: EventTarget | null, view: object): Element | null => {
  let node = target instanceof Node ? (target instanceof Element ? target : target.parentElement) : null
  while (node && drawn.get(node) !== view) node = node.parentElement
  return node
}

// Only the innermost drawn element around the event target forwards it (the target itself, or the element
// around slot content the user clicked); the worker's DOM bubbles it from there.
const forward = (view: object, listener: unknown, detail: (event: SyntheticEvent) => unknown = () => ({})) =>
  typeof listener === 'function'
    ? (event: SyntheticEvent) => {
        if (innermostDrawn(event.target, view) === event.currentTarget) (listener as Listener)(detail(event))
      }
    : undefined

const fieldDetail = (event: SyntheticEvent) => {
  const field = event.currentTarget as HTMLInputElement
  return { value: field.value, checked: field.checked }
}

const htmlRenderer = (tag: string) =>
  createRemoteComponentRenderer(({ children, ...props }: ElementProps) => {
    const ref = useRef<HTMLInputElement | null>(null)
    const view = useViewToken()
    const register = useCallback(
      (element: HTMLInputElement | null) => {
        ref.current = element
        if (element) drawn.set(element, view)
      },
      [view],
    )
    const attributes = safeAttributes(props, usePropUrls())
    const isField = FIELD_TAGS.has(tag)

    // Fields stay uncontrolled so typing never waits on the worker; its value is applied when it differs.
    useEffect(() => {
      if (isField && ref.current && typeof attributes.value === 'string' && ref.current.value !== attributes.value) {
        ref.current.value = attributes.value
      }
    })

    const handlers = {
      onClick: (event: SyntheticEvent) => {
        if (tag === 'a' && !attributes.href) event.preventDefault()
        forward(view, props.onClick)?.(event)
      },
      onKeyDown: forward(view, props.onKeydown, (event) => ({ key: (event as unknown as KeyboardEvent).key })),
      onFocus: forward(view, props.onFocus),
      onBlur: forward(view, props.onBlur),
      onLoad: forward(view, props.onLoad),
      onError: forward(view, props.onError),
      onSubmit: (event: SyntheticEvent) => {
        event.preventDefault()
        forward(view, props.onSubmit)?.(event)
      },
      ...(isField && {
        onInput: forward(view, props.onInput, fieldDetail),
        onChange: forward(view, props.onChange, fieldDetail),
      }),
    }

    if (isField) {
      const { value, checked, ...rest } = attributes
      return createElement(
        tag,
        {
          ...rest,
          ...handlers,
          ref: register,
          defaultValue: value,
          defaultChecked: checked,
        },
        ...(tag === 'select' ? [children] : []),
      )
    }
    return createElement(
      tag,
      { ...attributes, ...handlers, ref: register },
      ...(tag === 'br' || tag === 'hr' || tag === 'img' || tag === 'input' ? [] : [children]),
    )
  })

export const HTML_COMPONENTS: [string, ReturnType<typeof createRemoteComponentRenderer>][] = HTML_TAGS.map((tag) => [
  `h-${tag.toLowerCase()}`,
  htmlRenderer(tag),
])
