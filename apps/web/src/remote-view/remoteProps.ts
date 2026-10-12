import { isValidElement, type ElementType, type ReactNode } from 'react'

export const SLOT_KEY = '__remoteSlot'
export const COMPONENT_KEY = '__remoteComponent'

export type Slots = Map<string, ReactNode | ElementType>

type Callback = (...args: unknown[]) => unknown

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && Object.getPrototypeOf(value) === Object.prototype

// Minified builds rename functions, so props named like components (icon, Icon, Component, …) count too.
const COMPONENT_PROP = /^(icon|component)$|(Icon|Component)$/

// A component passed as a prop (an icon, say): memo/forwardRef objects, or functions named or passed like components.
const isComponent = (value: unknown, key: string): value is ElementType =>
  (typeof value === 'function' &&
    (COMPONENT_PROP.test(key) || /^[A-Z]/.test((value as { displayName?: string }).displayName ?? value.name))) ||
  (typeof value === 'object' &&
    value !== null &&
    typeof (value as { $$typeof?: unknown }).$$typeof === 'symbol' &&
    !isValidElement(value))

// Turns app props into data the worker may see: React content becomes a slot the page fills,
// components stay on the page too, functions become stable callbacks so re-renders do not create new proxies.
export const toRemoteProps = (
  value: unknown,
  path: string,
  slots: Slots,
  callbacks: Map<string, Callback>,
  stable: Map<string, Callback>,
  latest: (path: string) => Callback | undefined,
  urls: Set<string> = new Set(),
): unknown => {
  if (typeof value === 'string' && /^https:\/\//i.test(value)) {
    try {
      urls.add(new URL(value).origin)
    } catch {}
  }
  if (isValidElement(value)) {
    slots.set(path, value)
    return { [SLOT_KEY]: path }
  }
  if (isComponent(value, path.slice(path.lastIndexOf('.') + 1))) {
    slots.set(path, value)
    return { [COMPONENT_KEY]: path }
  }
  if (typeof value === 'function') {
    callbacks.set(path, value as Callback)
    let proxy = stable.get(path)
    if (!proxy) {
      proxy = (...args: unknown[]) => latest(path)?.(...args)
      stable.set(path, proxy)
    }
    return proxy
  }
  if (Array.isArray(value)) {
    return value.map((item, index) => toRemoteProps(item, `${path}.${index}`, slots, callbacks, stable, latest, urls))
  }
  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        toRemoteProps(item, `${path}.${key}`, slots, callbacks, stable, latest, urls),
      ]),
    )
  }
  return value
}
