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
  ComboSubmit = 'combo-submit',
  Feature = 'feature',
  Footer = 'footer',
  Sidebar = 'sidebar',
}

type SlotComponentPropsMap = {
  [SlotName.Submit]: PropsWithChildren<{
    onSubmit: SubmitCallback
  }>
  [SlotName.ComboSubmit]: PropsWithChildren<{
    onSubmit: SubmitCallback
    options: string[]
    onChange: (option: string) => void
  }>
}

export type SlotComponentProps<T extends SlotName> = T extends keyof SlotComponentPropsMap
  ? SlotComponentPropsMap[T]
  : {}

type SlotContextType = {
  registerSlot: <T extends SlotName>(
    slotName: T,
    id: string,
    Component: ComponentType<SlotComponentProps<T> | any>,
  ) => void
  unregisterSlot: (slotName: SlotName, id: string) => void
  getSlot: <T extends SlotName>(slotName: T, id?: string) => ComponentType<SlotComponentProps<T> | any>[]
  getSlotIds: (slotName: SlotName) => string[]
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
    <T extends SlotName>(slotName: T, id?: string): ComponentType<SlotComponentProps<T>>[] => {
      const slot = slots[slotName]

      if (id) {
        const Component = slot?.[id]
        if (Component) {
          return [Component]
        }
      }

      return Object.values(slot || {}).filter((component) => !!component) as ComponentType<SlotComponentProps<T>>[]
    },
    [slots],
  )

  const getSlotIds = useCallback(
    (slotName: SlotName): string[] => {
      const slot = slots[slotName]
      if (!slot) return []
      return Object.keys(slot).filter((id) => !!slot?.[id])
    },
    [slots],
  )

  return (
    <SlotContext.Provider value={{ registerSlot, unregisterSlot, getSlot, getSlotIds }}>
      {children}
    </SlotContext.Provider>
  )
}
