import type { ComponentType } from 'react'
import {
  createRemoteComponentRenderer,
  RemoteFragmentRenderer,
  type RemoteComponentRendererProps,
} from '@remote-dom/react/host'
import { HTML_COMPONENTS } from './html'
import { PRIMITIVE_COMPONENTS } from './primitives'
import { useSlot } from './slots'

const RemoteSlot = createRemoteComponentRenderer(({ name }: { name?: unknown }) => <>{useSlot(name)}</>)

const NotAllowed = () => null

// Elements that are not listed render nothing, together with everything inside them.
class Allowlist<K, V> extends Map<K, V> {
  constructor(
    entries: [K, V][],
    private readonly fallback: V,
  ) {
    super(entries)
  }

  get(key: K): V {
    return super.get(key) ?? this.fallback
  }
}

// The allowlist: the only elements a remote view can make the page draw. Each renderer keeps only safe attributes.
export const REMOTE_COMPONENTS = new Allowlist<string, ComponentType<RemoteComponentRendererProps>>(
  [...HTML_COMPONENTS, ...PRIMITIVE_COMPONENTS, ['ui-slot', RemoteSlot], ['remote-fragment', RemoteFragmentRenderer]],
  NotAllowed,
)
