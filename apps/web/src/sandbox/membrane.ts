import * as React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import policy from '../../sandbox/policy.json'

type Fn = (...args: unknown[]) => unknown
type Obj = Record<PropertyKey, unknown>

const ELEMENT_TYPES = new Set<unknown>([Symbol.for('react.transitional.element'), Symbol.for('react.element')])

const HOST_DENY = new Set([
  'script',
  'iframe',
  'frame',
  'frameset',
  'object',
  'embed',
  'base',
  'link',
  'meta',
  'style',
  'portal',
  'template',
  'slot',
])

const URL_PROPS = new Set([
  'href',
  'xlinkHref',
  'src',
  'srcSet',
  'action',
  'formAction',
  'poster',
  'data',
  'ping',
  'background',
  'cite',
  'codebase',
  'manifest',
  'lowsrc',
])

const ELEMENT_TYPE_PROPS = new Set(['as', 'component', 'render'])

const isObjectLike = (v: unknown): v is object => (typeof v === 'object' && v !== null) || typeof v === 'function'

const isPlainObject = (v: object): boolean => {
  const proto = Object.getPrototypeOf(v)
  return proto === Object.prototype || proto === null
}

const isElementLike = (v: object): boolean => ELEMENT_TYPES.has((v as Obj).$$typeof)

const isHostCapability = (v: object): boolean =>
  (typeof Node !== 'undefined' && v instanceof Node) ||
  (typeof Window !== 'undefined' && v instanceof Window) ||
  (typeof EventTarget !== 'undefined' && v instanceof EventTarget) ||
  (typeof Storage !== 'undefined' && v instanceof Storage)

const isEvent = (v: object): boolean =>
  (typeof Event !== 'undefined' && v instanceof Event) || ('nativeEvent' in v && 'isDefaultPrevented' in v)

// Values handed to view code (proxies, wrappers, tokens) map back to the trusted original here.
const toTrusted = new WeakMap<object, unknown>()
// Values handed to trusted code (copies, wrappers of view functions) map back to the view original here.
const toView = new WeakMap<object, unknown>()
const inboundCache = new WeakMap<object, unknown>()
const outboundCache = new WeakMap<object, unknown>()
// Real React elements created through `viewJsx`; anything else element-shaped from view code is forged.
const viewElements = new WeakSet<object>()
const writableRefs = new WeakSet<object>()
// Trusted values written to accept view-side arguments, such as the React module seen by views.
const viewSafe = new WeakSet<object>()

const OPAQUE_KEY = '__sandboxOpaque'

const opaqueToken = (real: unknown, label: string): object => {
  const token = Object.freeze(Object.create(null, { [Symbol.toStringTag]: { value: `Sandboxed${label}` } }))
  toTrusted.set(token, real)
  return token
}

const urlToken = (url: string): object => {
  const token = Object.freeze({ toString: () => url })
  toTrusted.set(token, url)
  return token
}

const isSameOriginUrlObject = (url: object): boolean => {
  const { protocol, host, hostname, href } = url as Obj
  const rawPathname = (url as Obj).pathname
  // A pathname the view got from its props arrives as a token; the trusted string behind it decides.
  const pathname = isObjectLike(rawPathname) && toTrusted.has(rawPathname) ? toTrusted.get(rawPathname) : rawPathname
  return (
    protocol === undefined &&
    host === undefined &&
    hostname === undefined &&
    href === undefined &&
    (pathname === undefined || (typeof pathname === 'string' && isSafeLiteralUrl(pathname)))
  )
}

const isOnHost = (url: string, hosts: string[]): boolean => {
  try {
    const { protocol, hostname } = new URL(url)
    return protocol === 'https:' && hosts.some((h) => hostname === h || hostname.endsWith(`.${h}`))
  } catch {
    return false
  }
}

// A link only leaves the app on a click; images and other resources load by themselves, so their hosts are listed separately.
const isMailToHost = (url: string, hosts: string[]): boolean => {
  const domain = /^mailto:[^@?/]+@([^?/]+)$/i.exec(url)?.[1].toLowerCase()
  return !!domain && hosts.some((h) => domain === h || domain.endsWith(`.${h}`))
}

const isAllowedUrl = (key: string, url: string): boolean =>
  key === 'href'
    ? isOnHost(url, policy.linkHosts) || isMailToHost(url, policy.linkHosts)
    : isOnHost(url, policy.assetHosts) || (key === 'src' && url.startsWith('data:image/'))

const isSafeLiteralUrl = (url: string): boolean =>
  url === '' || url.startsWith('#') || url.startsWith('?') || (url.startsWith('/') && !url.startsWith('//'))

function Opaque(props: Obj): React.ReactNode {
  const { [OPAQUE_KEY]: token, ...extra } = props
  const real = toTrusted.get(token as object) as React.ReactElement<Obj>
  if (Object.keys(extra).length === 0) return real
  const realRef = (real.props as Obj).ref
  const extraRef = extra.ref
  if (realRef && extraRef) extra.ref = mergeRefs(realRef, extraRef)
  return React.cloneElement(real, extra)
}

const mergeRefs =
  (...refs: unknown[]) =>
  (node: unknown) => {
    for (const ref of refs) {
      if (typeof ref === 'function') ref(node)
      else if (isObjectLike(ref)) (ref as { current: unknown }).current = node
    }
  }

const safeEvent = (event: object): object => {
  const e = event as Obj & { preventDefault?: () => void; stopPropagation?: () => void }
  const target = (e.target ?? {}) as Obj
  const snapshot = (t: Obj) =>
    Object.freeze({
      value: t.value,
      checked: t.checked,
      name: t.name,
      type: t.type,
      id: t.id,
    })
  return Object.freeze({
    type: e.type,
    key: e.key,
    code: e.code,
    altKey: e.altKey,
    ctrlKey: e.ctrlKey,
    metaKey: e.metaKey,
    shiftKey: e.shiftKey,
    button: e.button,
    buttons: e.buttons,
    clientX: e.clientX,
    clientY: e.clientY,
    deltaX: e.deltaX,
    deltaY: e.deltaY,
    timeStamp: e.timeStamp,
    defaultPrevented: e.defaultPrevented,
    target: snapshot(target),
    currentTarget: snapshot((e.currentTarget ?? {}) as Obj),
    preventDefault: () => e.preventDefault?.(),
    stopPropagation: () => e.stopPropagation?.(),
    isDefaultPrevented: () => Boolean(e.defaultPrevented),
    isPropagationStopped: () => false,
    persist: () => undefined,
  })
}

const shadowProxy = (real: object, { writable = false }: { writable?: boolean } = {}): object => {
  const shadow = Array.isArray(real) ? [] : typeof real === 'function' ? () => undefined : {}
  const proxy: object = new Proxy(shadow, {
    get: (_, key) => {
      if (key === '__esModule') return (real as Obj).__esModule
      const value = Reflect.get(real, key)
      if (typeof key === 'string' && URL_PROPS.has(key) && typeof value === 'string') return urlToken(value)
      return inbound(value)
    },
    set: (_, key, value) => (writable ? Reflect.set(real, key, outbound(value)) : false),
    has: (_, key) => Reflect.has(real, key),
    ownKeys: () => Reflect.ownKeys(real),
    getOwnPropertyDescriptor: (_, key) => {
      if (Array.isArray(real) && key === 'length') {
        return { configurable: false, enumerable: false, writable: true, value: (real as unknown[]).length }
      }
      const desc = Reflect.getOwnPropertyDescriptor(real, key)
      if (!desc) return undefined
      return { configurable: true, enumerable: desc.enumerable, writable: false, value: (proxy as Obj)[key as string] }
    },
    getPrototypeOf: () => (Array.isArray(real) ? Array.prototype : isPlainObject(real) ? Object.prototype : null),
    defineProperty: () => false,
    deleteProperty: () => false,
    setPrototypeOf: () => false,
    apply: (_, thisArg, args) => inbound(Reflect.apply(real as Fn, outbound(thisArg), args.map(outbound))),
  })
  toTrusted.set(proxy, real)
  return proxy
}

/** Converts a value going from trusted code into view code. */
export function inbound(value: unknown): unknown {
  if (!isObjectLike(value)) return value
  if (toView.has(value)) return toView.get(value)
  if (toTrusted.has(value) || viewSafe.has(value)) return value
  const cached = inboundCache.get(value)
  if (cached !== undefined) return cached

  let result: unknown
  if (typeof value === 'object' && isHostCapability(value)) result = opaqueToken(value, 'Node')
  else if (typeof value === 'object' && isEvent(value)) result = safeEvent(value)
  else if (typeof value === 'object' && isElementLike(value)) {
    const element = viewElements.has(value)
      ? value
      : React.createElement(Opaque, {
          ...((value as Obj).key != null && { key: (value as Obj).key as string }),
          [OPAQUE_KEY]: opaqueToken(value, 'Element'),
        })
    viewElements.add(element)
    result = shadowProxy(element)
  } else if (value instanceof Date || value instanceof RegExp) result = value
  else result = shadowProxy(value)

  if (typeof value !== 'object' || !isEvent(value)) inboundCache.set(value, result)
  return result
}

const wrapViewFunction = (fn: Fn): Fn => {
  const wrapper = function (this: unknown, ...args: unknown[]) {
    return outbound(Reflect.apply(fn, inbound(this), args.map(inbound)))
  }
  Object.defineProperty(wrapper, 'name', { value: fn.name || 'SandboxedView' })
  toView.set(wrapper, fn)
  return wrapper
}

const remember = (value: object, result: object): object => {
  toView.set(result, value)
  outboundCache.set(value, result)
  return result
}

/** Converts a value going from view code into trusted code. */
export function outbound(value: unknown): unknown {
  if (!isObjectLike(value)) return value
  if (toTrusted.has(value)) {
    const real = toTrusted.get(value)
    // Hand trusted code its own element, so libraries like Base UI merge its props instead of overwriting them.
    if (isObjectLike(real) && (real as React.ReactElement).type === Opaque)
      return toTrusted.get(((real as React.ReactElement).props as Obj)[OPAQUE_KEY] as object)
    return real
  }
  if (toView.has(value)) return value
  const cached = outboundCache.get(value)
  if (cached !== undefined) return cached

  if (typeof value === 'function') return remember(value, wrapViewFunction(value as Fn))
  if ('$$typeof' in value) return null
  if (!Array.isArray(value) && !isPlainObject(value)) return value

  const copy: Obj | unknown[] = Array.isArray(value) ? [] : {}
  remember(value, copy)
  for (const key of Reflect.ownKeys(value)) {
    if (Array.isArray(value) && key === 'length') continue
    ;(copy as Obj)[key as string] = outbound((value as Obj)[key as string])
  }
  return copy
}

const sanitizeStyle = (style: unknown): unknown => {
  if (!isObjectLike(style)) return undefined
  const clean: Obj = {}
  for (const [key, val] of Object.entries(style)) {
    if (typeof val === 'number' || (typeof val === 'string' && !/url\(|image-set\(|expression\(/i.test(val)))
      clean[key] = val
  }
  return clean
}

const warnDropped = (key: string, value: unknown) =>
  console.warn(
    `[sandbox] a view set ${key} to ${JSON.stringify(value)}; views may only link to paths, hosts in the policy, or values passed in`,
  )

const sanitizeProps = (type: unknown, props: Obj | null | undefined): Obj => {
  const isHost = typeof type === 'string'
  const clean: Obj = {}
  for (const key of Object.keys(props ?? {})) {
    const value = (props as Obj)[key]
    if (key === 'dangerouslySetInnerHTML') continue
    if (URL_PROPS.has(key)) {
      if (typeof value === 'string') {
        if (isSafeLiteralUrl(value) || isAllowedUrl(key, value)) clean[key] = value
        else warnDropped(key, value)
        continue
      }
      const real = isObjectLike(value) ? toTrusted.get(value) : undefined
      if (typeof real === 'string' || (isObjectLike(real) && !toTrusted.has(real))) clean[key] = real
      else if (isObjectLike(value) && isSameOriginUrlObject(value)) clean[key] = outbound(value)
      else if (value !== undefined) warnDropped(key, value)
      continue
    }
    if (ELEMENT_TYPE_PROPS.has(key) && typeof value === 'string' && HOST_DENY.has(value)) continue
    if (isHost && key === 'style') {
      clean[key] = sanitizeStyle(value)
      continue
    }
    if (isHost && key === 'ref' && isObjectLike(value) && !toTrusted.has(value) && typeof value !== 'function') continue
    clean[key] = outbound(value)
  }
  return clean
}

const checkType = (type: unknown): unknown => {
  if (typeof type === 'string') return HOST_DENY.has(type.toLowerCase()) ? null : type
  return outbound(type)
}

const createViewElement = (
  build: (type: React.ElementType, props: Obj) => React.ReactElement,
  type: unknown,
  props: Obj,
) => {
  const realType = checkType(type)
  if (realType === null) return null
  const element = build(realType as React.ElementType, sanitizeProps(realType, props))
  viewElements.add(element)
  return inbound(element)
}

const keyOf = (key: unknown) => (key === undefined ? undefined : String(key))

export const viewJsx = (type: unknown, props: Obj, key?: unknown) =>
  createViewElement((t, p) => jsx(t, p, keyOf(key)), type, props)

const viewJsxs = (type: unknown, props: Obj, key?: unknown) =>
  createViewElement((t, p) => jsxs(t, p, keyOf(key)), type, props)

const viewCreateElement = (type: unknown, props: Obj | null, ...children: unknown[]) =>
  createViewElement(
    (t, p) => React.createElement(t, p, ...(children.map(outbound) as React.ReactNode[])),
    type,
    props ?? {},
  )

const viewCloneElement = (element: unknown, props: Obj | null, ...children: unknown[]) => {
  const real = isObjectLike(element) ? toTrusted.get(element) : undefined
  if (!isObjectLike(real) || !viewElements.has(real)) return null
  const clean = sanitizeProps((real as React.ReactElement).type, props ?? {})
  const cloned =
    children.length > 0
      ? React.cloneElement(real as React.ReactElement, clean, ...(children.map(outbound) as React.ReactNode[]))
      : React.cloneElement(real as React.ReactElement, clean)
  viewElements.add(cloned)
  return inbound(cloned)
}

const useViewRef = (initial?: unknown) => {
  const ref = React.useRef(outbound(initial))
  return writableShadow(ref)
}

const viewCreateRef = () => writableShadow(React.createRef())

const writableShadow = (ref: object) => {
  const cached = inboundCache.get(ref)
  if (cached && writableRefs.has(cached as object)) return cached
  const proxy = shadowProxy(ref, { writable: true })
  writableRefs.add(proxy)
  inboundCache.set(ref, proxy)
  return proxy
}

/** Builds the React and jsx-runtime modules seen by view code. */
export const viewReactModules = (): Record<string, unknown> => {
  const reactOverrides = {
    createElement: viewCreateElement,
    cloneElement: viewCloneElement,
    useRef: useViewRef,
    createRef: viewCreateRef,
  }
  const react: object = new Proxy(
    {},
    {
      get: (_, key) =>
        key === '__esModule'
          ? true
          : key === 'default'
            ? react
            : key in reactOverrides
              ? reactOverrides[key as keyof typeof reactOverrides]
              : inbound(Reflect.get(React, key)),
      has: (_, key) => key === '__esModule' || Reflect.has(React, key),
      ownKeys: () => Reflect.ownKeys(React),
      getOwnPropertyDescriptor: (_, key) =>
        Reflect.has(React, key)
          ? { configurable: true, enumerable: true, writable: false, value: (react as Obj)[key as string] }
          : undefined,
    },
  )
  const jsxRuntime = Object.freeze({
    __esModule: true,
    jsx: viewJsx,
    jsxs: viewJsxs,
    jsxDEV: viewJsx,
    Fragment: React.Fragment,
  })
  for (const value of [react, jsxRuntime, ...Object.values(reactOverrides), viewJsx, viewJsxs]) viewSafe.add(value)
  toTrusted.set(react, React)
  return { react, 'react/jsx-runtime': jsxRuntime, 'react/jsx-dev-runtime': jsxRuntime }
}
