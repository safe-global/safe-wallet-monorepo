import { createElement, isValidElement, type ReactNode } from 'react'
import { createRemoteElement } from '@remote-dom/core/elements'

// One remote element for every primitive the page draws (Base UI needs the real DOM: focus, layout, portals).
export const UiPrimitiveElement = createRemoteElement({
  attributes: ['name'],
  properties: { props: { type: Object } },
})

export const ELEMENT_KEY = '__remoteElement'

const isContent = (value: unknown): boolean =>
  isValidElement(value) || (Array.isArray(value) && value.length > 0 && value.every((item) => isContent(item)))

// Stands in for a primitive inside the worker. Data and callbacks travel as `props`; React content passed in
// props travels as named slots, which the page hands back to the real primitive under the same prop name.
export const hostPrimitive = (name: string) => {
  const Primitive = ({ children, ...props }: Record<string, unknown> & { children?: ReactNode }) => {
    const data: Record<string, unknown> = {}
    const slots: ReactNode[] = []
    for (const [key, value] of Object.entries(props)) {
      if (key === 'ref' || typeof value === 'symbol') continue
      // Base UI clones `render` elements and adds its own handlers, so a plain tag crosses as a description
      // the page rebuilds as a real element.
      if (key === 'render' && isValidElement(value) && typeof value.type === 'string' && value.type.startsWith('h-')) {
        const { children: _children, ...attributes } = value.props as Record<string, unknown>
        data.render = { [ELEMENT_KEY]: value.type.slice(2), attributes }
      } else if (isContent(value)) slots.push(createElement('remote-fragment', { key, slot: key }, value as ReactNode))
      else data[key] = value
    }
    return createElement('ui-primitive', { name, props: data }, ...slots, children)
  }
  Primitive.displayName = name
  return Primitive
}
