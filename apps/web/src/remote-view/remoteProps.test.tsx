import { memo, type ReactNode } from 'react'
import { COMPONENT_KEY, SLOT_KEY, toRemoteProps, type Slots } from './remoteProps'

const Icon = () => <svg />
const MemoIcon = memo(Icon)

const convert = (props: Record<string, unknown>) => {
  const slots: Slots = new Map()
  const callbacks = new Map<string, (...args: unknown[]) => unknown>()
  const data = toRemoteProps(props, 'props', slots, callbacks, new Map(), (path) => callbacks.get(path))
  return { data: data as Record<string, unknown>, slots, callbacks }
}

describe('toRemoteProps', () => {
  it('keeps components on the page and sends a marker', () => {
    const { data, slots } = convert({ icon: Icon, memoIcon: MemoIcon })

    expect(data).toEqual({ icon: { [COMPONENT_KEY]: 'props.icon' }, memoIcon: { [COMPONENT_KEY]: 'props.memoIcon' } })
    expect(slots.get('props.icon')).toBe(Icon)
    expect(slots.get('props.memoIcon')).toBe(MemoIcon)
  })

  it('treats functions passed under component prop names as components, even when minified', () => {
    const minified = () => null
    const { data } = convert({ icon: minified, items: [{ Icon: minified, onClick: minified }], startIcon: minified })

    expect(data.icon).toEqual({ [COMPONENT_KEY]: 'props.icon' })
    expect(data.startIcon).toEqual({ [COMPONENT_KEY]: 'props.startIcon' })
    expect(data.items).toEqual([{ Icon: { [COMPONENT_KEY]: 'props.items.0.Icon' }, onClick: expect.any(Function) }])
  })

  it('keeps React content in slots and sends callbacks as stable functions', () => {
    const content: ReactNode = <b>hi</b>
    const onClick = jest.fn()
    const { data, slots, callbacks } = convert({ title: content, onClick })

    expect(data.title).toEqual({ [SLOT_KEY]: 'props.title' })
    expect(slots.get('props.title')).toBe(content)
    expect(typeof data.onClick).toBe('function')
    expect(data.onClick).not.toBe(onClick)
    expect(callbacks.get('props.onClick')).toBe(onClick)
  })
})
