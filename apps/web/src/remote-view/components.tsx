import type { ComponentType, ReactNode } from 'react'
import {
  createRemoteComponentRenderer,
  RemoteFragmentRenderer,
  type RemoteComponentRendererProps,
} from '@remote-dom/react/host'
import { Button } from '@safe-global/views/components/ui/button'

// The allowlist: the only elements a remote view can make the page draw, and the only props each one keeps.
const BUTTON_VARIANTS = ['default', 'secondary', 'outline', 'ghost'] as const
const BUTTON_SIZES = ['default', 'sm', 'lg', 'action'] as const

const pick = <T extends string>(value: unknown, allowed: readonly T[]): T | undefined =>
  allowed.find((option) => option === value)

const text = (value: unknown): string | undefined => (typeof value === 'string' ? value : undefined)

const RemoteDiv = createRemoteComponentRenderer(
  ({ children, class: className }: { children?: ReactNode; class?: unknown }) => (
    <div className={text(className)}>{children}</div>
  ),
)

const RemoteButton = createRemoteComponentRenderer(
  ({
    children,
    variant,
    size,
    disabled,
    onClick,
  }: {
    children?: ReactNode
    variant?: unknown
    size?: unknown
    disabled?: unknown
    onClick?: () => void
  }) => (
    <Button
      variant={pick(variant, BUTTON_VARIANTS)}
      size={pick(size, BUTTON_SIZES)}
      disabled={disabled != null && disabled !== false}
      onClick={() => onClick?.()}
    >
      {children}
    </Button>
  ),
)

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

export const REMOTE_COMPONENTS = new Allowlist<string, ComponentType<RemoteComponentRendererProps>>(
  [
    ['div', RemoteDiv],
    ['ui-button', RemoteButton],
    ['remote-fragment', RemoteFragmentRenderer],
  ],
  NotAllowed,
)
