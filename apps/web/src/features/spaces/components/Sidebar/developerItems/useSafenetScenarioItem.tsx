import { useCallback, useState } from 'react'
import { useLoadFeature } from '@/features/__core__'
import { SafenetChecksPrototypeFeature, useIsSafenetPrototypeEnabled } from '@/features/safenet-checks'
import type { SidebarDeveloperItemState } from '../types'

/** Opens the Safenet prototype's scenario switcher; hidden until `SAFENET_CHECKS_PROTOTYPE` is on. */
export const useSafenetScenarioItem = (): SidebarDeveloperItemState => {
  const [isOpen, setOpen] = useState(false)
  const isEnabled = useIsSafenetPrototypeEnabled()
  const { SafenetScenarioDialog } = useLoadFeature(SafenetChecksPrototypeFeature)
  const onSelect = useCallback(() => setOpen(true), [])

  return {
    hidden: !isEnabled,
    onSelect,
    dialog: <SafenetScenarioDialog open={isOpen} onOpenChange={setOpen} />,
  }
}
