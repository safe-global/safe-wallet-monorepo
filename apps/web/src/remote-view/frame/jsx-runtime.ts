import * as React from 'react'
import * as runtime from 'react/jsx-runtime'
import { HTML_ATTRIBUTES, remoteTag } from './html'

// JSX runtime for the worker build: HTML and SVG tags become remote `h-*` elements with attribute names
// the page understands. Everything else is React as usual.
export const Fragment = runtime.Fragment

const ATTRIBUTE_BY_LOWER = new Map(HTML_ATTRIBUTES.map((name) => [name.toLowerCase(), name]))
const ALIASES: Record<string, string> = { className: 'class', htmlFor: 'for', xlinkHref: 'href' }

const kebab = (name: string) => name.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`)

const attributeName = (prop: string): string | null =>
  ALIASES[prop] ?? ATTRIBUTE_BY_LOWER.get(prop.toLowerCase()) ?? ATTRIBUTE_BY_LOWER.get(kebab(prop)) ?? null

const styleString = (style: Record<string, unknown>) =>
  Object.entries(style)
    .filter(([, value]) => value != null && value !== false)
    .map(
      ([key, value]) =>
        `${key.startsWith('--') ? key : kebab(key)}:${typeof value === 'number' && value !== 0 && !key.startsWith('--') ? `${value}px` : value}`,
    )
    .join(';')

type Handler = (event: unknown) => void
const FIELD_EVENTS: Record<string, string> = { onChange: 'input', onInput: 'input' }
const PASSTHROUGH = new Set(['children', 'key', 'ref', 'onClick', 'onKeyDown', 'onSubmit', 'onFocus', 'onBlur'])

const toRemoteProps = (props: Record<string, unknown>) => {
  const next: Record<string, unknown> = {}
  const fieldHandlers: [string, Handler][] = []
  for (const [prop, value] of Object.entries(props)) {
    if (PASSTHROUGH.has(prop)) {
      next[prop] = value
    } else if (prop in FIELD_EVENTS) {
      if (typeof value === 'function') fieldHandlers.push([FIELD_EVENTS[prop], value as Handler])
    } else if (prop === 'style' && value && typeof value === 'object') {
      next['remote-style'] = styleString(value as Record<string, unknown>)
    } else if (prop === 'dangerouslySetInnerHTML') {
      continue
    } else {
      const name = attributeName(prop)
      if (name && value != null && value !== false && typeof value !== 'function') {
        next[name] = value === true ? '' : String(value)
      }
    }
  }
  return { next, fieldHandlers }
}

// React only fires onChange for real form fields, so remote fields get their listeners through a ref.
const RemoteField = ({
  tag,
  fieldHandlers,
  props,
}: {
  tag: string
  fieldHandlers: [string, Handler][]
  props: Record<string, unknown>
}) => {
  const handlers = React.useRef(fieldHandlers)
  handlers.current = fieldHandlers
  const attach = React.useCallback((element: EventTarget | null) => {
    if (!element) return
    const listener = (event: Event) => {
      const synthetic = {
        type: event.type,
        target: element,
        currentTarget: element,
        nativeEvent: event,
        preventDefault: () => event.preventDefault(),
        stopPropagation: () => event.stopPropagation(),
      }
      for (const [type, handler] of handlers.current) if (type === event.type) handler(synthetic)
    }
    element.addEventListener('input', listener)
    return () => element.removeEventListener('input', listener)
  }, [])
  return runtime.jsx(tag as React.ElementType, { ...props, ref: attach })
}

const convert = (type: unknown, props: Record<string, unknown>) => {
  // Hyphenated tags are our own remote elements (ui-slot, h-*); leave them alone.
  if (typeof type !== 'string' || type.includes('-')) return null
  const tag = remoteTag(type)
  if (!tag) return { type: 'h-unknown', props: {} }
  const { next, fieldHandlers } = toRemoteProps(props)
  if (fieldHandlers.length) return { type: RemoteField, props: { tag, fieldHandlers, props: next } }
  return { type: tag, props: next }
}

export const jsx = (type: unknown, props: Record<string, unknown>, key?: React.Key) => {
  const converted = convert(type, props)
  return converted
    ? runtime.jsx(converted.type as React.ElementType, converted.props, key)
    : runtime.jsx(type as React.ElementType, props, key)
}

export const createElement = (type: unknown, props: Record<string, unknown> | null, ...children: unknown[]) => {
  const converted = convert(type, {
    ...(props ?? {}),
    ...(children.length ? { children: children.length === 1 ? children[0] : children } : {}),
  })
  return converted
    ? React.createElement(converted.type as React.ElementType, { ...converted.props, key: props?.key })
    : React.createElement(type as React.ElementType, props, ...(children as React.ReactNode[]))
}

export const jsxs = (type: unknown, props: Record<string, unknown>, key?: React.Key) => {
  const converted = convert(type, props)
  return converted
    ? runtime.jsxs(converted.type as React.ElementType, converted.props, key)
    : runtime.jsxs(type as React.ElementType, props, key)
}
