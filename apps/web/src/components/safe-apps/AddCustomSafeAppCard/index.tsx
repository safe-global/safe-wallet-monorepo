import { useState } from 'react'
import type { SafeApp as SafeAppData } from '@safe-global/store/gateway/AUTO_GENERATED/safe-apps'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import AddCustomAppIcon from '@/public/images/apps/add-custom-app.svg'
import { AddCustomAppModal } from '@/components/safe-apps/AddCustomAppModal'

type Props = { onSave: (data: SafeAppData) => void; safeAppList: SafeAppData[] }

const AddCustomSafeAppCard = ({ onSave, safeAppList }: Props) => {
  const [addCustomAppModalOpen, setAddCustomAppModalOpen] = useState<boolean>(false)

  return (
    <>
      <Card size="none">
        <div className="flex flex-col items-center px-3 py-12">
          {/* Add Custom Safe App Icon */}
          <AddCustomAppIcon alt="Add Custom Safe App card" />

          {/*  Add Custom Safe App Button */}
          <Button size="sm" onClick={() => setAddCustomAppModalOpen(true)} className="mt-6">
            Add custom Safe App
          </Button>
        </div>
      </Card>

      {/*  Add Custom Safe App Modal */}
      <AddCustomAppModal
        open={addCustomAppModalOpen}
        onClose={() => setAddCustomAppModalOpen(false)}
        onSave={onSave}
        safeAppsList={safeAppList}
      />
    </>
  )
}

export default AddCustomSafeAppCard
