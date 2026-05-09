import { useState } from 'react'
import Card from '@mui/material/Card'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import type { SafeApp as SafeAppData } from '@safe-global/store/gateway/AUTO_GENERATED/safe-apps'

import AddCustomAppIcon from '@/public/images/apps/add-custom-app.svg'
import { AddCustomAppModal } from '@/components/safe-apps/AddCustomAppModal'

type Props = { onSave: (data: SafeAppData) => void; safeAppList: SafeAppData[] }

const AddCustomSafeAppCard = ({ onSave, safeAppList }: Props) => {
  const [addCustomAppModalOpen, setAddCustomAppModalOpen] = useState<boolean>(false)

  return (
    <>
      <Card>
        <Box p="48px 12px" display="flex" flexDirection="column" alignItems="center">
          {/* Add Custom Safe App Icon */}
          <AddCustomAppIcon alt="Add Custom Safe App card" />

          {/*  Add Custom Safe App Button */}
          <Button
            variant="contained"
            size="small"
            onClick={() => setAddCustomAppModalOpen(true)}
            sx={{
              mt: 3,
            }}
          >
            Add custom Safe App
          </Button>
        </Box>
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
