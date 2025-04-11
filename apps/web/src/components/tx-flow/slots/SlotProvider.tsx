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
    onSubmit?: () => void
    onSubmitSuccess?: SubmitCallback
  }>
  [SlotName.ComboSubmit]: PropsWithChildren<{
    onSubmit?: () => void
    onSubmitSuccess?: SubmitCallback
    options: { label: string; id: string }[]
    onChange: (option: string) => void
    disabled?: boolean
  }>
}

type BaseSlotComponentProps = {
  slotId: string
}

export type SlotComponentProps<T extends SlotName> = T extends keyof SlotComponentPropsMap
  ? SlotComponentPropsMap[T] & BaseSlotComponentProps
  : BaseSlotComponentProps

type SlotContextType = {
  registerSlot: <T extends SlotName>(args: {
    slotName: T
    id: string
    Component: SlotItem<T>['Component']
    label?: SlotItem<T>['label']
  }) => void
  unregisterSlot: (slotName: SlotName, id: string) => void
  getSlot: <T extends SlotName>(slotName: T, id?: string) => SlotItem<T>[]
  getSlotIds: (slotName: SlotName) => string[]
}

export type SlotItem<S extends SlotName> = {
  Component: ComponentType<SlotComponentProps<S>>
  id: string
  label: string
}

type SlotStore = {
  [K in SlotName]?: {
    [id: string]: SlotItem<K> | null
  }
}

export const SlotContext = createContext<SlotContextType | null>(null)

/**
 * SlotProvider is a context provider for managing slots in the transaction flow.
 * It allows components to register and unregister themselves in specific slots,
 * and provides a way to retrieve the components registered in a slot.
 */
export const SlotProvider = ({ children }: { children: ReactNode }) => {
  const [slots, setSlots] = useState<SlotStore>({})

  const registerSlot = useCallback<SlotContextType['registerSlot']>(({ slotName, id, Component, label }) => {
    setSlots((prevSlots) => ({
      ...prevSlots,
      [slotName]: { ...prevSlots[slotName], [id]: { Component, label: label || id, id } },
    }))
  }, [])

  const unregisterSlot = useCallback((slotName: SlotName, id: string) => {
    setSlots((prevSlots) => ({
      ...prevSlots,
      [slotName]: { ...prevSlots[slotName], [id]: null },
    }))
  }, [])

  const getSlot = useCallback(
    <T extends SlotName>(slotName: T, id?: string): SlotItem<T>[] => {
      const slot = slots[slotName]

      if (id) {
        const slotItem = slot?.[id]
        if (slotItem) {
          return [slotItem]
        }
      }

      return Object.values(slot || {}).filter((component) => !!component) as SlotItem<T>[]
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
