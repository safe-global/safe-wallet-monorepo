import { createElement, isValidElement, type ComponentType, type ElementType, type ReactNode } from 'react'
import { createRemoteComponentRenderer } from '@remote-dom/react/host'
import { HOST_PRIMITIVES } from './primitiveRegistry'
import { HTML_TAGS } from './frame/html'
import { ELEMENT_KEY } from './frame/primitive'
import { isAllowedUrl, safeAttributes } from './html'
import { usePropUrls, useSlotComponent } from './slots'

const DROPPED = new Set(['ref', 'dangerouslySetInnerHTML', 'as'])
const UNSAFE_STYLE = /url\s*\(|expression\s*\(|@import|image-set/i

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && Object.getPrototypeOf(value) === Object.prototype

// What a view's callback may receive: plain data only, never events, DOM nodes or page functions.
const toCloneable = (value: unknown): unknown => {
  if (value == null || typeof value !== 'object')
    return typeof value === 'function' || typeof value === 'symbol' ? undefined : value
  if (value instanceof Event || 'nativeEvent' in value || value instanceof Node) return undefined
  if (Array.isArray(value)) return value.map(toCloneable)
  if (!isPlainObject(value)) return undefined
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, toCloneable(item)]))
}

const safeProps = (props: unknown, propOrigins: Set<string>) => {
  const safe: Record<string, unknown> = {}
  if (!isPlainObject(props)) return safe
  for (const [key, value] of Object.entries(props)) {
    if (DROPPED.has(key)) continue
    if (typeof value === 'function') {
      // A function-valued render prop would return worker objects the page cannot draw.
      if (key === 'render' || key === 'children') continue
      safe[key] = (...args: unknown[]) => {
        void (value as (...cloneable: unknown[]) => unknown)(...args.map(toCloneable))
      }
    } else if (key === 'render' && isPlainObject(value) && typeof value[ELEMENT_KEY] === 'string') {
      const tag = HTML_TAGS.find((name) => name.toLowerCase() === value[ELEMENT_KEY])
      if (tag)
        safe.render = createElement(
          tag,
          safeAttributes((value.attributes ?? {}) as Record<string, unknown>, propOrigins),
        )
    } else if ((key === 'href' || key === 'src') && typeof value === 'string') {
      if (isAllowedUrl(value, key, propOrigins)) safe[key] = value
    } else if (key === 'style' && isPlainObject(value)) {
      if (!Object.values(value).some((item) => typeof item === 'string' && UNSAFE_STYLE.test(item))) safe.style = value
    } else {
      safe[key] = value
    }
  }
  return safe
}

const usePrimitive = (name: unknown) =>
  typeof name === 'string' ? (HOST_PRIMITIVES[name] as ComponentType<Record<string, unknown>>) : null

const hostRenderer = (useComponent: (name: unknown) => ElementType | null) =>
  createRemoteComponentRenderer(
    ({ name, props, children, ...slots }: Record<string, unknown> & { children?: ReactNode }) => {
      const propOrigins = usePropUrls()
      const Primitive = useComponent(name)
      if (!Primitive) return null
      const content = Object.fromEntries(Object.entries(slots).filter(([, value]) => isValidElement(value)))
      const hasChildren = Array.isArray(children) ? children.length > 0 : children != null
      return createElement(
        Primitive,
        { ...safeProps(props, propOrigins), ...content },
        ...(hasChildren ? [children] : []),
      )
    },
  )

export const PRIMITIVE_COMPONENTS: [string, ReturnType<typeof hostRenderer>][] = [
  ['ui-primitive', hostRenderer(usePrimitive)],
  // Components the app passed to a view (icons and the like): app code, drawn with the view's props filtered.
  ['ui-component', hostRenderer(useSlotComponent)],
]
