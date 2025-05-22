import type { PropsWithChildren, ReactElement } from 'react'
import { type SlotComponentProps, type SlotName, useSlot } from '@/components/tx-flow/slots'

export type SlotProps<T extends SlotName> = PropsWithChildren<
  {
    name: T
    id?: string
  } & Omit<SlotComponentProps<T>, 'slotId'>
>

/**
 * Slot component for rendering components in specific slots.
 * It takes a slot name and an optional id to identify the slot.
 * If there are registered components for the slot, it renders them.
 * Otherwise, it renders the children passed to it as fallback.
 */
export const Slot = <T extends SlotName>({ name, id, children, ...rest }: SlotProps<T>): ReactElement => {
  const slotItems = useSlot(name, id)

  if (slotItems.length === 0) {
    return <>{children}</>
  }

  const props = { ...rest, slotId: id } as unknown as SlotComponentProps<T>

  return (
    <>
      {slotItems.map(({ Component, id }, i) => (
        <Component {...props} key={`slot-${name}-${i}-${id}`} />
      ))}
    </>
  )
}
