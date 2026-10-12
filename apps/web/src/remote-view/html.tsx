import { createElement, useEffect, useRef, type ReactNode, type SyntheticEvent } from 'react'
import { createRemoteComponentRenderer } from '@remote-dom/react/host'
import { HTML_ATTRIBUTES, HTML_TAGS } from './frame/html'
import { usePropUrls } from './slots'

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

const safeAttributes = (props: ElementProps, propOrigins: Set<string>) => {
  const safe: Record<string, unknown> = {}
  for (const [name, value] of Object.entries(props)) {
    if (!ATTRIBUTES.has(name) || typeof value !== 'string') continue
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

// Only the element the event happened on forwards it; the worker's DOM bubbles it from there.
const forward = (listener: unknown, detail: (event: SyntheticEvent) => unknown = () => ({})) =>
  typeof listener === 'function'
    ? (event: SyntheticEvent) => {
        if (event.target === event.currentTarget) (listener as Listener)(detail(event))
      }
    : undefined

const fieldDetail = (event: SyntheticEvent) => {
  const field = event.currentTarget as HTMLInputElement
  return { value: field.value, checked: field.checked }
}

const htmlRenderer = (tag: string) =>
  createRemoteComponentRenderer(({ children, ...props }: ElementProps) => {
    const ref = useRef<HTMLInputElement>(null)
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
        forward(props.onClick)?.(event)
      },
      onKeyDown: forward(props.onKeydown, (event) => ({ key: (event as unknown as KeyboardEvent).key })),
      onFocus: forward(props.onFocus),
      onBlur: forward(props.onBlur),
      onSubmit: (event: SyntheticEvent) => {
        event.preventDefault()
        forward(props.onSubmit)?.(event)
      },
      ...(isField && {
        onInput: forward(props.onInput, fieldDetail),
        onChange: forward(props.onChange, fieldDetail),
      }),
    }

    if (isField) {
      const { value, checked, ...rest } = attributes
      return createElement(
        tag,
        {
          ...rest,
          ...handlers,
          ref,
          defaultValue: value,
          defaultChecked: checked,
        },
        ...(tag === 'select' ? [children] : []),
      )
    }
    return createElement(
      tag,
      { ...attributes, ...handlers },
      ...(tag === 'br' || tag === 'hr' || tag === 'img' || tag === 'input' ? [] : [children]),
    )
  })

export const HTML_COMPONENTS: [string, ReturnType<typeof createRemoteComponentRenderer>][] = HTML_TAGS.map((tag) => [
  `h-${tag.toLowerCase()}`,
  htmlRenderer(tag),
])
