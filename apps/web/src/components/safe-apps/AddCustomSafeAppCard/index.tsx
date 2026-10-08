import { useState } from 'react'
import type { SafeApp as SafeAppData } from '@safe-global/store/gateway/AUTO_GENERATED/safe-apps'
import { AddCustomAppModal } from '@/components/safe-apps/AddCustomAppModal'
import { AddCustomSafeAppCardView } from '@views/components/safe-apps/AddCustomSafeAppCard/AddCustomSafeAppCardView'

type Props = { onSave: (data: SafeAppData) => void; safeAppList: SafeAppData[] }

const AddCustomSafeAppCard = ({ onSave, safeAppList }: Props) => {
  const [addCustomAppModalOpen, setAddCustomAppModalOpen] = useState<boolean>(false)

  return (
    <AddCustomSafeAppCardView
      onOpenModal={() => setAddCustomAppModalOpen(true)}
      modal={
        <AddCustomAppModal
          open={addCustomAppModalOpen}
          onClose={() => setAddCustomAppModalOpen(false)}
          onSave={onSave}
          safeAppsList={safeAppList}
        />
      }
    />
  )
}

export default AddCustomSafeAppCard
