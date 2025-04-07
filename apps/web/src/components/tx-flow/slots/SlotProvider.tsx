import React, {
  createContext,
  type ReactNode,
  type ComponentType,
  useState,
  useCallback,
  type PropsWithChildren,
} from 'react'
import type { SubmitCallback } from '../TxFlow'

export enum SlotName {
  Submit = 'submit',
  Action = 'action',
  Feature = 'feature',
  Sidebar = 'sidebar',
}

type SlotComponentPropsMap = {
  [SlotName.Submit]: PropsWithChildren<{
    onSubmit: SubmitCallback
  }>
  [SlotName.Action]: {
    onSubmit?: (args?: any) => void
  }
  [SlotName.Feature]: {}
  [SlotName.Sidebar]: {}
}

export type SlotComponentProps<T extends SlotName> = SlotComponentPropsMap[T]

type SlotContextType = {
  registerSlot: <T extends SlotName>(
    slotName: T,
    id: string,
    Component: ComponentType<SlotComponentProps<T> | any>,
  ) => void
  unregisterSlot: (slotName: SlotName, id: string) => void
  getSlot: <T extends SlotName>(slotName: T) => ComponentType<SlotComponentProps<T> | any>[]
}

type SlotStore = {
  [K in SlotName]?: Record<string, ComponentType<SlotComponentProps<K>> | null> | null
}

export const SlotContext = createContext<SlotContextType | null>(null)

/**
 * SlotProvider is a context provider for managing slots in the transaction flow.
 * It allows components to register and unregister themselves in specific slots,
 * and provides a way to retrieve the components registered in a slot.
 */
export const SlotProvider = ({ children }: { children: ReactNode }) => {
  const [slots, setSlots] = useState<SlotStore>({})

  const registerSlot = useCallback<SlotContextType['registerSlot']>((slotName, id, Component) => {
    setSlots((prevSlots) => ({
      ...prevSlots,
      [slotName]: { ...prevSlots[slotName], [id]: Component },
    }))
  }, [])

  const unregisterSlot = useCallback((slotName: SlotName, id: string) => {
    setSlots((prevSlots) => ({
      ...prevSlots,
      [slotName]: { ...prevSlots[slotName], [id]: null },
    }))
  }, [])

  const getSlot = useCallback(
    <T extends SlotName>(slotName: T): ComponentType<SlotComponentProps<T>>[] => {
      const slot = slots[slotName]
      return Object.values(slot || {}).filter((component) => !!component) as ComponentType<SlotComponentProps<T>>[]
    },
    [slots],
  )

  return <SlotContext.Provider value={{ registerSlot, unregisterSlot, getSlot }}>{children}</SlotContext.Provider>
}
